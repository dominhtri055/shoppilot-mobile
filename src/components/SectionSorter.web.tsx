"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import {
  moveSection,
  nearestSection,
  sectionLabels,
  type SectionId,
  type SectionSorterProps,
} from "./section-order";

type Drag = {
  id: SectionId;
  pointerId: number;
  startY: number;
  offset: number;
  target: number;
  order: SectionId[];
  centers: number[];
  bounds: { left: number; right: number; top: number; bottom: number };
};

export function SectionSorter({
  sections,
  hiddenSections = [],
  disabled = false,
  onChange,
  onDragStateChange,
}: SectionSorterProps) {
  const helpId = useId();
  const list = useRef<HTMLOListElement>(null);
  const rows = useRef(new Map<SectionId, HTMLLIElement>());
  const active = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dragging = drag !== null;

  const cancel = useCallback(() => {
    if (!active.current) return;
    active.current = null;
    setDrag(null);
    setAnnouncement("Move cancelled. Section order unchanged.");
    onDragStateChange?.(false);
  }, [onDragStateChange]);

  useEffect(() => {
    if (!dragging) return;
    // Cancel if the viewport changes: the recorded drop slots are no longer valid.
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    window.addEventListener("scroll", cancel, true);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("scroll", cancel, true);
    };
  }, [dragging, cancel]);
  useEffect(() => () => onDragStateChange?.(false), [onDragStateChange]);

  function commit(id: SectionId, target: number) {
    if (disabled) return;
    const next = moveSection(sections, id, target);
    if (next === sections) return;
    onChange(next);
    setAnnouncement(
      `${sectionLabels[id]} moved to position ${target + 1} of ${sections.length}.`,
    );
  }
  function start(event: PointerEvent<HTMLButtonElement>, id: SectionId) {
    if (
      disabled ||
      active.current ||
      !event.isPrimary ||
      event.button !== 0 ||
      !list.current
    )
      return;
    const centers = sections.map((section) => {
      const rect = rows.current.get(section)!.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const next: Drag = {
      id,
      pointerId: event.pointerId,
      startY: event.clientY,
      offset: 0,
      target: sections.indexOf(id),
      order: [...sections],
      centers,
      bounds: list.current.getBoundingClientRect(),
    };
    active.current = next;
    setDrag(next);
    onDragStateChange?.(true);
  }
  function position(event: PointerEvent<HTMLButtonElement>, current: Drag) {
    const offset = event.clientY - current.startY;
    const { left, right, top, bottom } = current.bounds;
    const inside =
      event.clientX >= left &&
      event.clientX <= right &&
      event.clientY >= top - 16 &&
      event.clientY <= bottom + 16;
    return {
      ...current,
      offset,
      target: inside
        ? nearestSection(
            current.centers,
            current.centers[current.order.indexOf(current.id)] + offset,
          )
        : -1,
    };
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = active.current;
    if (!current || event.pointerId !== current.pointerId) return;
    if (disabled) return cancel();
    const next = position(event, current);
    active.current = next;
    setDrag(next);
  }
  function drop(event: PointerEvent<HTMLButtonElement>) {
    const current = active.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const next = position(event, current);
    if (
      disabled ||
      next.target < 0 ||
      current.order.join() !== sections.join()
    ) {
      cancel();
    } else {
      active.current = null;
      setDrag(null);
      onDragStateChange?.(false);
      commit(current.id, next.target);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div style={styles.container}>
      <p id={helpId} style={styles.help}>
        Drag a handle to reorder. You can also use the arrow buttons or focus a
        handle and press ↑ / ↓. Press Escape to cancel a drag.
      </p>
      <ol ref={list} aria-label="Page sections" style={styles.list}>
        {sections.map((id, index) => {
          const pickedUp = drag?.id === id;
          const destination = drag && drag.target === index && !pickedUp;
          return (
            <li
              key={id}
              ref={(node) => {
                if (node) rows.current.set(id, node);
                else rows.current.delete(id);
              }}
              data-section={id}
              data-drop-target={destination ? "true" : undefined}
              style={{
                ...styles.row,
                ...(destination
                  ? {
                      borderColor: "#2563EB",
                      boxShadow: `0 ${index > sections.indexOf(drag.id) ? "3" : "-3"}px 0 #2563EB`,
                    }
                  : {}),
                ...(pickedUp
                  ? {
                      transform: `translateY(${drag.offset}px)`,
                      zIndex: 2,
                      background: "#EFF6FF",
                      boxShadow: "0 8px 20px #0F172A26",
                    }
                  : {}),
              }}
            >
              <button
                type="button"
                aria-label={`Reorder ${sectionLabels[id]}`}
                aria-describedby={helpId}
                disabled={disabled}
                style={{
                  ...styles.button,
                  ...styles.handle,
                  cursor: pickedUp ? "grabbing" : "grab",
                }}
                onPointerDown={(e) => start(e, id)}
                onPointerMove={move}
                onPointerUp={drop}
                onPointerCancel={cancel}
                onLostPointerCapture={cancel}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancel();
                  } else if (
                    !dragging &&
                    (e.key === "ArrowUp" || e.key === "ArrowDown")
                  ) {
                    e.preventDefault();
                    commit(id, index + (e.key === "ArrowUp" ? -1 : 1));
                  }
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 22 }}>
                  ⠿
                </span>
              </button>
              <div style={styles.label}>
                <span>{sectionLabels[id]}</span>
                <small style={styles.meta}>
                  {index + 1} / {sections.length}
                  {hiddenSections.includes(id) ? " · Hidden" : ""}
                </small>
              </div>
              <button
                type="button"
                aria-label={`Move ${sectionLabels[id]} up`}
                style={styles.button}
                disabled={disabled || dragging || index === 0}
                onClick={() => commit(id, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${sectionLabels[id]} down`}
                style={styles.button}
                disabled={disabled || dragging || index === sections.length - 1}
                onClick={() => commit(id, index + 1)}
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={styles.status}
      >
        {drag
          ? drag.target < 0
            ? "Release to cancel."
            : `Drop ${sectionLabels[drag.id]} at position ${drag.target + 1}.`
          : announcement}
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { minWidth: 0, color: "#0F172A", fontFamily: "inherit" },
  help: { color: "#64748B", fontSize: 12, lineHeight: 1.6, margin: "0 0 12px" },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  row: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    gap: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    background: "#FFFFFF",
    padding: "10px 4px",
    minHeight: 68,
    boxSizing: "border-box",
  },
  button: {
    flexShrink: 0,
    width: 36,
    minHeight: 44,
    display: "grid",
    placeItems: "center",
    padding: 0,
    margin: 0,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    background: "#FFFFFF",
    color: "inherit",
    fontSize: 17,
  },
  handle: {
    width: 32,
    touchAction: "none",
    userSelect: "none",
    borderColor: "transparent",
    background: "transparent",
  },
  label: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  meta: { fontSize: 11, color: "#64748B", fontWeight: 400 },
  status: {
    minHeight: 32,
    fontSize: 12,
    lineHeight: 1.4,
    color: "#1D4ED8",
    margin: "10px 0 0",
  },
};
