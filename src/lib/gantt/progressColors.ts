export type GanttProgressColors = {
  baseColor: string;
  progressColor: string;
  remainingColor: string;
  borderColor: string;
};

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
const fallbackProgressColor = "#5B6EE1";

export function normalizeHexColor(
  color: string | undefined,
  fallback = fallbackProgressColor,
): string {
  if (!color || !hexColorPattern.test(color)) {
    return fallback;
  }

  return `#${color.slice(1).toUpperCase()}`;
}

function parseHexColor(color: string): [number, number, number] {
  const normalized = normalizeHexColor(color);

  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function toHexChannel(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function formatHexColor(red: number, green: number, blue: number): string {
  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
}

function mixHexColor(color: string, target: string, amount: number): string {
  const [red, green, blue] = parseHexColor(color);
  const [targetRed, targetGreen, targetBlue] = parseHexColor(target);
  const clampedAmount = Math.min(1, Math.max(0, amount));

  return formatHexColor(
    red + (targetRed - red) * clampedAmount,
    green + (targetGreen - green) * clampedAmount,
    blue + (targetBlue - blue) * clampedAmount,
  );
}

export function darkenHexColor(color: string, amount = 0.14): string {
  return mixHexColor(color, "#000000", amount);
}

export function tintHexColor(color: string, amount = 0.88): string {
  return mixHexColor(color, "#FFFFFF", amount);
}

export function createGanttProgressColors(color: string): GanttProgressColors {
  const baseColor = normalizeHexColor(color);

  return {
    baseColor,
    progressColor: darkenHexColor(baseColor, 0.14),
    remainingColor: tintHexColor(baseColor, 0.88),
    borderColor: darkenHexColor(baseColor, 0.08),
  };
}
