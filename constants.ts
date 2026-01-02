import { Theme, ThemeColors } from './types';

export const APP_NAME = "FRAME NOTES";
export const AUTHOR_HANDLE = "@jaideepmmhaan";

export const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    bg: "bg-neutral-950",
    surface: "bg-neutral-900",
    text: "text-neutral-200",
    textMuted: "text-neutral-500",
    accent: "text-cyan-400",
    border: "border-neutral-800",
  },
  pink: {
    bg: "bg-[#2e0b16]", // Slightly richer deep pink
    surface: "bg-[#4a1220]",
    text: "text-pink-100",
    textMuted: "text-pink-300/50",
    accent: "text-pink-500", // Hot Pink
    border: "border-pink-900/30",
  },
  royal: {
    bg: "bg-[#020617]", // Darker Navy
    surface: "bg-[#0f172a]",
    text: "text-blue-50",
    textMuted: "text-blue-300/50",
    accent: "text-amber-400", // Gold for Royale
    border: "border-blue-900/30",
  },
};

export const NEON_COLORS = [
  "#22d3ee", // Cyan
  "#e879f9", // Fuchsia
  "#a78bfa", // Violet
  "#fb7185", // Rose
  "#facc15", // Yellow
  "#ffffff", // White
];