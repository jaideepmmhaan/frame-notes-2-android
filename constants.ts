import { Theme, ThemeColors } from './types';

export const APP_NAME = "FRAME NOTES";
export const AUTHOR_HANDLE = "@jaideepmmhaan";

export const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    bg: "bg-black",
    surface: "bg-[#141414]", // Slightly lighter black for cards
    text: "text-white",
    textMuted: "text-neutral-500",
    accent: "text-cyan-400",
    border: "border-white/10",
  },
  pink: {
    bg: "bg-[#180509]", // Very dark pink-black
    surface: "bg-[#2e0b16]",
    text: "text-pink-100",
    textMuted: "text-pink-300/50",
    accent: "text-pink-500",
    border: "border-pink-500/20",
  },
  royal: {
    bg: "bg-[#020410]", // Deepest navy
    surface: "bg-[#0a0f2c]",
    text: "text-blue-50",
    textMuted: "text-blue-300/50",
    accent: "text-amber-400",
    border: "border-blue-500/20",
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