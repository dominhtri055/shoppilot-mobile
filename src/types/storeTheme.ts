export type StoreTheme = {
  accent: string;
  background: string;
  font: "sans" | "serif";
  corners: "soft" | "square";
  layout: "split" | "centered";
  columns: 2 | 3 | 4;
  announcement: string;
  heading: string;
  description: string;
  banner: string;
  about: string;
  showHero: boolean;
  showAbout: boolean;
  showInventory: boolean;
  sections: ("hero" | "products" | "about")[];
};
export const defaultTheme: StoreTheme = {
  accent: "#174D3C",
  background: "#FFFFFF",
  font: "sans",
  corners: "soft",
  layout: "split",
  columns: 3,
  announcement: "",
  heading: "",
  description: "",
  banner: "",
  about: "",
  showHero: true,
  showAbout: false,
  showInventory: true,
  sections: ["hero", "products", "about"],
};
export const presets: Record<string, Partial<StoreTheme>> = {
  Studio: {
    accent: "#174D3C",
    background: "#FFFFFF",
    font: "sans",
    corners: "soft",
    layout: "split",
  },
  Editorial: {
    accent: "#71333F",
    background: "#FFF9F5",
    font: "serif",
    corners: "square",
    layout: "split",
  },
  Electric: {
    accent: "#3531CF",
    background: "#F5F6FF",
    font: "sans",
    corners: "square",
    layout: "centered",
  },
};
export function isValidBanner(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function normalizeTheme(input: unknown): StoreTheme {
  const v =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const text = (key: string, max: number) =>
    typeof v[key] === "string" ? (v[key] as string).slice(0, max) : "";
  const color = (key: "accent" | "background") =>
    /^#[0-9a-f]{6}$/i.test(String(v[key])) ? String(v[key]) : defaultTheme[key];
  const sections = Array.isArray(v.sections) ? v.sections : [];
  return {
    ...defaultTheme,
    accent: color("accent"),
    background: color("background"),
    font: v.font === "serif" ? "serif" : "sans",
    corners: v.corners === "square" ? "square" : "soft",
    layout: v.layout === "centered" ? "centered" : "split",
    columns: v.columns === 2 || v.columns === 4 ? v.columns : 3,
    announcement: text("announcement", 160),
    heading: text("heading", 120),
    description: text("description", 500),
    banner: isValidBanner(text("banner", 2048))
      ? text("banner", 2048).trim()
      : "",
    about: text("about", 2000),
    showHero: v.showHero !== false,
    showAbout: v.showAbout === true,
    showInventory: v.showInventory !== false,
    sections:
      sections.length === 3 &&
      new Set(sections).size === 3 &&
      sections.every((s) => ["hero", "products", "about"].includes(s))
        ? (sections as StoreTheme["sections"])
        : defaultTheme.sections,
  };
}
export function contrastText(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((c) => {
      const v = parseInt(c, 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179
    ? "#101820"
    : "#FFFFFF";
}
