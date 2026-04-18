import { createGanttProgressColors } from "./progressColors";
import { defaultGanttPalette, type GanttPalette } from "./theme";
import {
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
  type GanttChartType,
  type GanttTask,
  type GanttTaskStatus,
} from "./taskModel";

type GanttSemanticName = "success" | "warning" | "danger";

export type GanttTaskColorSource =
  | "task-palette"
  | "manual"
  | "group"
  | "milestone"
  | `semantic-${GanttSemanticName}`;

export type GanttTaskVisual = {
  baseColor: string;
  progressColor: string;
  remainingColor: string;
  borderColor: string;
  paletteIndex: number;
  colorSource: GanttTaskColorSource;
  cssClassName: string;
};

const semanticStatusMap: Partial<Record<GanttTaskStatus, GanttSemanticName>> = {
  "on-track": "success",
  "at-risk": "warning",
  blocked: "danger",
  done: "success",
};

export function stableHashString(value: string): number {
  return Array.from(value).reduce(
    (hash, character) => (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0,
    2166136261,
  );
}

export function getTaskColorAssignmentKey(task: GanttTask): string {
  return (
    task.phase?.trim() ||
    task.section?.trim() ||
    task.stage?.trim() ||
    task.parentId?.trim() ||
    task.id.trim() ||
    task.name.trim() ||
    "gantt-task"
  );
}

export function getGanttTaskPaletteIndex(
  task: GanttTask,
  palette: GanttPalette = defaultGanttPalette,
): number {
  return (
    stableHashString(getTaskColorAssignmentKey(task)) %
    palette.taskColors.length
  );
}

function getSemanticColor(task: GanttTask): GanttSemanticName | undefined {
  return task.status ? semanticStatusMap[task.status] : undefined;
}

function isMilestoneTask(task: GanttTask, chartType?: GanttChartType): boolean {
  return (
    chartType === "milestones" ||
    task.nodeType === "milestone" ||
    Boolean(task.customClass?.includes("milestone"))
  );
}

function isGroupTask(task: GanttTask): boolean {
  return (
    task.nodeType === "group" || Boolean(task.customClass?.includes("group"))
  );
}

export function resolveGanttTaskVisual(
  task: GanttTask,
  {
    chartType,
    palette = defaultGanttPalette,
  }: {
    chartType?: GanttChartType;
    palette?: GanttPalette;
  } = {},
): GanttTaskVisual {
  const paletteIndex = getGanttTaskPaletteIndex(task, palette);

  if (isGroupTask(task)) {
    return {
      ...createGanttProgressColors(palette.neutral.groupBar),
      paletteIndex,
      colorSource: "group",
      cssClassName: "gantt-group-bar",
    };
  }

  if (isMilestoneTask(task, chartType)) {
    return {
      ...createGanttProgressColors(palette.semantic.milestone),
      paletteIndex,
      colorSource: "milestone",
      cssClassName: "gantt-milestone-bar",
    };
  }

  const semanticColor = getSemanticColor(task);

  if (semanticColor) {
    return {
      ...createGanttProgressColors(palette.semantic[semanticColor]),
      paletteIndex,
      colorSource: `semantic-${semanticColor}`,
      cssClassName: `gantt-semantic-${semanticColor}`,
    };
  }

  if (isValidGanttTaskColor(task.color)) {
    return {
      ...createGanttProgressColors(normalizeGanttTaskColor(task.color)),
      paletteIndex,
      colorSource: "manual",
      cssClassName: "gantt-task-manual",
    };
  }

  return {
    ...createGanttProgressColors(palette.taskColors[paletteIndex]),
    paletteIndex,
    colorSource: "task-palette",
    cssClassName: `gantt-task-color-${paletteIndex}`,
  };
}
