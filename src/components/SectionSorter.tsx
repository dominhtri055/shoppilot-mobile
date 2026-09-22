import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from "react-native";
import {
  moveSection,
  nearestSection,
  sectionLabels,
  type SectionId,
  type SectionSorterProps,
} from "./section-order";

type Drag = {
  id: SectionId;
  order: SectionId[];
  centers: number[];
  top: number;
  bottom: number;
  offset: number;
  target: number;
};

type HandleProps = {
  id: SectionId;
  index: number;
  count: number;
  disabled: boolean;
  onStart: () => void;
  onMove: (offset: number) => void;
  onEnd: () => void;
  onCancel: () => void;
  onAdjust: (direction: number) => void;
};

function NativeDragHandle(props: HandleProps) {
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  // PanResponder owns gesture state, so keep the same instance while dragging.
  // PanResponder.create only registers callbacks; their ref reads happen on gestures.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onPanResponderGrant: () => latest.current.onStart(),
      onPanResponderMove: (_, gesture) => {
        if (latest.current.disabled || gesture.numberActiveTouches > 1)
          latest.current.onCancel();
        else latest.current.onMove(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        latest.current.onMove(gesture.dy);
        latest.current.onEnd();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => latest.current.onCancel(),
    }),
  );
  return (
    <View
      {...responder.panHandlers}
      style={styles.handle}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Reorder ${sectionLabels[props.id]}`}
      accessibilityHint="Drag to reorder, or adjust up or down."
      accessibilityState={{ disabled: props.disabled }}
      accessibilityValue={{ min: 1, max: props.count, now: props.index + 1 }}
      accessibilityActions={[
        { name: "increment", label: "Move down" },
        { name: "decrement", label: "Move up" },
      ]}
      onAccessibilityAction={(event) => {
        if (!props.disabled)
          props.onAdjust(event.nativeEvent.actionName === "increment" ? 1 : -1);
      }}
    >
      <Text style={styles.grip}>⠿</Text>
    </View>
  );
}

export function SectionSorter({
  sections,
  hiddenSections = [],
  disabled = false,
  onChange,
  onDragStateChange,
}: SectionSorterProps) {
  const layouts = useRef(new Map<SectionId, LayoutRectangle>());
  const active = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => () => onDragStateChange?.(false), [onDragStateChange]);

  function commit(id: SectionId, target: number) {
    if (disabled) return;
    const next = moveSection(sections, id, target);
    if (next === sections) return;
    onChange(next);
    const result = `${sectionLabels[id]} moved to position ${target + 1} of ${sections.length}.`;
    setMessage(result);
    AccessibilityInfo.announceForAccessibility(result);
  }
  function start(id: SectionId) {
    if (
      disabled ||
      active.current ||
      sections.some((section) => !layouts.current.has(section))
    )
      return;
    const slots = sections.map((section) => layouts.current.get(section)!);
    const next: Drag = {
      id,
      order: [...sections],
      centers: slots.map((slot) => slot.y + slot.height / 2),
      top: slots[0].y,
      bottom: slots[slots.length - 1].y + slots[slots.length - 1].height,
      offset: 0,
      target: sections.indexOf(id),
    };
    active.current = next;
    setDrag(next);
    onDragStateChange?.(true);
  }
  function move(offset: number) {
    const current = active.current;
    if (!current) return;
    const y = current.centers[current.order.indexOf(current.id)] + offset;
    const next = {
      ...current,
      offset,
      target:
        y >= current.top - 16 && y <= current.bottom + 16
          ? nearestSection(current.centers, y)
          : -1,
    };
    active.current = next;
    setDrag(next);
  }
  function finish(cancelled = false) {
    const current = active.current;
    if (!current) return;
    active.current = null;
    setDrag(null);
    onDragStateChange?.(false);
    if (
      cancelled ||
      disabled ||
      current.target < 0 ||
      current.order.join() !== sections.join()
    ) {
      setMessage("Move cancelled. Section order unchanged.");
      return;
    }
    commit(current.id, current.target);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.help}>
        Drag a handle to reorder your sections, or use the arrow buttons.
      </Text>
      <View style={styles.list} accessibilityLabel="Page sections">
        {sections.map((id, index) => {
          const pickedUp = drag?.id === id;
          const destination = drag?.target === index && !pickedUp;
          return (
            <View
              key={id}
              onLayout={(event) =>
                layouts.current.set(id, event.nativeEvent.layout)
              }
              style={[
                styles.row,
                destination && styles.destination,
                pickedUp && {
                  backgroundColor: "#EFF6FF",
                  zIndex: 2,
                  elevation: 5,
                  transform: [{ translateY: drag.offset }],
                },
              ]}
            >
              <NativeDragHandle
                id={id}
                index={index}
                count={sections.length}
                disabled={disabled || (!!drag && !pickedUp)}
                onStart={() => start(id)}
                onMove={move}
                onEnd={() => finish()}
                onCancel={() => finish(true)}
                onAdjust={(direction) => {
                  if (!drag) commit(id, index + direction);
                }}
              />
              <View style={styles.label}>
                <Text style={styles.title}>{sectionLabels[id]}</Text>
                <Text style={styles.help}>
                  {index + 1} / {sections.length}
                  {hiddenSections.includes(id) ? " · Hidden" : ""}
                </Text>
              </View>
              {([-1, 1] as const).map((direction) => {
                const unavailable =
                  disabled ||
                  !!drag ||
                  index + direction < 0 ||
                  index + direction >= sections.length;
                return (
                  <Pressable
                    key={direction}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${sectionLabels[id]} ${direction < 0 ? "up" : "down"}`}
                    accessibilityState={{ disabled: unavailable }}
                    disabled={unavailable}
                    onPress={() => commit(id, index + direction)}
                    style={[styles.button, unavailable && styles.disabled]}
                  >
                    <Text style={styles.arrow}>
                      {direction < 0 ? "↑" : "↓"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {drag
          ? drag.target < 0
            ? "Release to cancel."
            : `Drop ${sectionLabels[drag.id]} at position ${drag.target + 1}.`
          : message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  help: { fontSize: 12, lineHeight: 18, color: "#64748B" },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  destination: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  handle: {
    width: 36,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  grip: { fontSize: 24, color: "#0F172A" },
  label: { flex: 1, gap: 4 },
  title: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  button: {
    width: 36,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
  },
  disabled: { opacity: 0.35 },
  arrow: { fontSize: 17, color: "#0F172A" },
  status: { minHeight: 32, fontSize: 12, color: "#1D4ED8" },
});
