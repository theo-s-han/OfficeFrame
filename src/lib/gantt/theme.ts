import { createGanttProgressColors } from "./progressColors";

export type GanttPalette = {
  id: string;
  name: string;
  taskColors: string[];
  neutral: {
    background: string;
    surface: string;
    gridLine: string;
    rowDivider: string;
    textPrimary: string;
    textSecondary: string;
    groupBar: string;
    secondaryBar: string;
    disabled: string;
    dependencyLine: string;
  };
  semantic: {
    success: string;
    warning: string;
    danger: string;
    milestone: string;
  };
};

export const enterpriseLightGanttPalette: GanttPalette = {
  id: "enterprise-light",
  name: "Enterprise Light",
  taskColors: [
    "#5B6EE1",
    "#2F7E9E",
    "#4E8B63",
    "#A07A2E",
    "#A65D7B",
    "#7A68B8",
  ],
  neutral: {
    background: "#FFFFFF",
    surface: "#F7F8FA",
    gridLine: "#E6E8EC",
    rowDivider: "#ECEEF2",
    textPrimary: "#1F2937",
    textSecondary: "#667085",
    groupBar: "#667085",
    secondaryBar: "#98A2B3",
    disabled: "#CBD5E1",
    dependencyLine: "#98A2B3",
  },
  semantic: {
    success: "#4E8B63",
    warning: "#D9A441",
    danger: "#D95C5C",
    milestone: "#C59B3A",
  },
};

export const ganttPalettes = [enterpriseLightGanttPalette] as const;
export const defaultGanttPalette = enterpriseLightGanttPalette;

export function getGanttPaletteCssVariables(
  palette: GanttPalette = defaultGanttPalette,
): Record<string, string> {
  const taskColorVariables = Object.fromEntries(
    palette.taskColors.flatMap((color, index) => {
      const progressColors = createGanttProgressColors(color);

      return [
        [`--gantt-task-${index}`, progressColors.baseColor],
        [`--gantt-task-${index}-progress`, progressColors.progressColor],
        [`--gantt-task-${index}-tint`, progressColors.remainingColor],
        [`--gantt-task-${index}-border`, progressColors.borderColor],
      ];
    }),
  );

  return {
    "--gantt-background": palette.neutral.background,
    "--gantt-surface": palette.neutral.surface,
    "--gantt-grid-line": palette.neutral.gridLine,
    "--gantt-row-divider": palette.neutral.rowDivider,
    "--gantt-text-primary": palette.neutral.textPrimary,
    "--gantt-text-secondary": palette.neutral.textSecondary,
    "--gantt-group-bar": palette.neutral.groupBar,
    "--gantt-secondary-bar": palette.neutral.secondaryBar,
    "--gantt-disabled": palette.neutral.disabled,
    "--gantt-dependency-line": palette.neutral.dependencyLine,
    "--gantt-success": palette.semantic.success,
    "--gantt-warning": palette.semantic.warning,
    "--gantt-danger": palette.semantic.danger,
    "--gantt-milestone": palette.semantic.milestone,
    ...taskColorVariables,
  };
}
