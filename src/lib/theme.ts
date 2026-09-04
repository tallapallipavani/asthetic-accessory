/* Brand theme tokens — use these instead of hard-coded hex/font strings. */

export const colors = {
  // gold family
  gold: "#C8973A",
  goldLight: "#F0C060",
  goldDark: "#B87830",
  goldPale: "#F5D98A",
  goldMuted: "#E8D9BE",

  // dark browns / inks
  ink: "#1C1208",
  inkSoft: "#2A1A0E",
  inkDeep: "#160C04",
  inkDarkest: "#0E0804",
  brownDeep: "#3A2010",

  // creams / backgrounds
  cream: "#FAF8F4",
  creamWarm: "#F7F2EC",
  creamMuted: "#F0EBE3",

  // warm tans (secondary text) — darkened for AA contrast on cream (~5.1:1)
  tan: "#7E6646",
  tanFaint: "#B4A090",
  tanWarm: "#C9B89E",

  // browns (primary text on light, muted links)
  brown: "#6B5344",
  // secondary text on dark surfaces — lightened for ≥4.5:1 on the ink gradients
  brownMid: "#AE8F6B",
  // helper captions on dark surfaces
  brownDim: "#9F825F",

  // lines / borders
  line: "#D4C4B0",
  lineSoft: "#C4B4A4",

  // success / positive
  success: "#6DBA5A",
  successDeep: "#4E8A3D",
  successInk: "#2F5D24",

  // destructive actions / errors
  danger: "#B3261E",

  // footer muted text — lightened for contrast on the near-black footer
  footerMuted: "#9A7B55",
  footerFaint: "#B39468",
} as const

export const fonts = {
  sans: "Inter",
  serif: "Playfair Display, serif",
  body: "Inter, sans-serif",
} as const

export const gradients = {
  gold: "linear-gradient(135deg, #C8973A, #F0C060)",
  goldBar: "linear-gradient(90deg,#B87830,#F0C060,#C8973A,#F0C060,#B87830)",
  modal: "linear-gradient(160deg, #2A1A0E 0%, #160C04 100%)",
  hero: "linear-gradient(135deg, #1C1208 0%, #2A1A0E 60%, #1A0E06 100%)",
  dark: "linear-gradient(135deg, #1C1208 0%, #2A1A0E 100%)",
  darkCta: "linear-gradient(135deg, #1C1208, #2A1A0E)",
  promo: "linear-gradient(135deg, #2A1A0E, #3A2010)",
  promoSuccess: "linear-gradient(135deg, #0A2A10, #143020)",
} as const