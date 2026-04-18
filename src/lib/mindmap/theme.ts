import type { Theme } from "mind-elixir";
import { createGanttProgressColors } from "@/lib/gantt/progressColors";
import { defaultGanttPalette } from "@/lib/gantt/theme";

export const mindmapPaletteColors = defaultGanttPalette.taskColors;

export type MindmapNodePresentation = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export const defaultMindmapTheme: Theme = {
  name: "Office Enterprise",
  type: "light",
  palette: mindmapPaletteColors,
  cssVar: {
    "--node-gap-x": "18px",
    "--node-gap-y": "16px",
    "--main-gap-x": "52px",
    "--main-gap-y": "24px",
    "--main-color": defaultGanttPalette.neutral.textPrimary,
    "--main-bgcolor": defaultGanttPalette.neutral.background,
    "--main-bgcolor-transparent": "rgba(255, 255, 255, 0.88)",
    "--color": defaultGanttPalette.neutral.textPrimary,
    "--bgcolor": defaultGanttPalette.neutral.background,
    "--selected": defaultGanttPalette.taskColors[0],
    "--accent-color": defaultGanttPalette.taskColors[1],
    "--root-color": defaultGanttPalette.neutral.textPrimary,
    "--root-bgcolor": defaultGanttPalette.neutral.background,
    "--root-border-color": defaultGanttPalette.taskColors[0],
    "--root-radius": "8px",
    "--main-radius": "8px",
    "--topic-padding": "8px 12px",
    "--panel-color": defaultGanttPalette.neutral.textPrimary,
    "--panel-bgcolor": defaultGanttPalette.neutral.surface,
    "--panel-border-color": defaultGanttPalette.neutral.rowDivider,
    "--map-padding": "32px",
  },
};

export function getMindmapPaletteColor(index: number): string {
  const normalizedIndex =
    ((index % mindmapPaletteColors.length) + mindmapPaletteColors.length) %
    mindmapPaletteColors.length;

  return mindmapPaletteColors[normalizedIndex] ?? mindmapPaletteColors[0];
}

export function getMindmapNodePresentation(
  color: string,
  depth: number,
  isRoot = false,
): MindmapNodePresentation {
  const progressColors = createGanttProgressColors(color);

  if (isRoot) {
    return {
      backgroundColor: defaultGanttPalette.neutral.background,
      borderColor: defaultGanttPalette.taskColors[0],
      textColor: defaultGanttPalette.neutral.textPrimary,
    };
  }

  if (depth <= 1) {
    return {
      backgroundColor: progressColors.baseColor,
      borderColor: progressColors.borderColor,
      textColor: "#FFFFFF",
    };
  }

  return {
    backgroundColor: progressColors.remainingColor,
    borderColor: progressColors.borderColor,
    textColor: defaultGanttPalette.neutral.textPrimary,
  };
}
