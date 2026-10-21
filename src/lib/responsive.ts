import { useWindowDimensions } from "react-native";

export type Breakpoint = "compact" | "regular" | "wide" | "tablet";

export type Responsive = {
  /** Current viewport width in dp. */
  width: number;
  /** Current viewport height in dp. */
  height: number;
  breakpoint: Breakpoint;
  /** Horizontal page padding. */
  gutter: number;
  /** Usable content width (excludes the gutters, capped at the web's 1140px). */
  contentWidth: number;
  isCompact: boolean;
  isRegular: boolean;
  isWide: boolean;
  /** True from 768dp — when two-column content actually has room to breathe. */
  isExpanded: boolean;
  isTablet: boolean;
  /** Linearly interpolates between two values as the viewport grows. */
  scale: (min: number, max: number) => number;
  clamp: (min: number, value: number, max: number) => number;
  /** Picks a column count from breakpoint-specific values. */
  columns: (options: { compact: number; regular?: number; wide?: number; tablet?: number }) => number;
  /** Width of a single grid cell for the given column count. */
  columnWidth: (columns: number, gap: number) => number;
};

const MAX_CONTENT_WIDTH = 1140;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Single source of truth for responsive layout. It reads `useWindowDimensions`,
 * so it reacts to rotation, foldables and split-screen resizing.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= 900 ? "tablet" : width >= 600 ? "wide" : width >= 390 ? "regular" : "compact";

  const gutter = breakpoint === "tablet" ? 40 : breakpoint === "wide" ? 32 : breakpoint === "regular" ? 20 : 16;
  const contentWidth = Math.min(width - gutter * 2, MAX_CONTENT_WIDTH);

  // 0 at 360dp, 1 at 720dp — keeps type readable on small phones and steady on tablets.
  const t = (clamp(width, 360, 720) - 360) / 360;
  const scale = (min: number, max: number) => Math.round(min + (max - min) * t);

  const columns = (options: { compact: number; regular?: number; wide?: number; tablet?: number }) => {
    if (breakpoint === "tablet") return options.tablet ?? options.wide ?? options.regular ?? options.compact;
    if (breakpoint === "wide") return options.wide ?? options.regular ?? options.compact;
    if (breakpoint === "regular") return options.regular ?? options.compact;
    return options.compact;
  };

  const columnWidth = (count: number, gap: number) =>
    Math.max(0, (contentWidth - gap * (count - 1)) / count);

  return {
    width,
    height,
    breakpoint,
    gutter,
    contentWidth,
    isCompact: breakpoint === "compact",
    isRegular: breakpoint === "regular",
    isWide: width >= 600,
    isExpanded: width >= 768,
    isTablet: width >= 900,
    scale,
    clamp: (min, value, max) => clamp(value, min, max),
    columns,
    columnWidth,
  };
}
