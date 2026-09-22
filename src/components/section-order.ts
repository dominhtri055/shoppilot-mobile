// Kept in sync with the merchant dashboard's section sorter.
export const sectionLabels = {
  hero: "Hero banner",
  products: "Collection",
  about: "Our story",
};
export type SectionId = keyof typeof sectionLabels;
export type SectionSorterProps = {
  sections: SectionId[];
  hiddenSections?: SectionId[];
  disabled?: boolean;
  onChange: (sections: SectionId[]) => void;
  onDragStateChange?: (dragging: boolean) => void;
};

// Move an item between slots; the intervening sections retain their order.
export function moveSection(sections: SectionId[], id: SectionId, to: number) {
  const from = sections.indexOf(id);
  if (from < 0 || !Number.isInteger(to) || to < 0 || to >= sections.length)
    return sections;
  if (from === to) return sections;
  const next = [...sections];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

export function nearestSection(centers: number[], y: number) {
  return centers.reduce(
    (closest, center, index) =>
      Math.abs(center - y) < Math.abs(centers[closest] - y) ? index : closest,
    0,
  );
}
