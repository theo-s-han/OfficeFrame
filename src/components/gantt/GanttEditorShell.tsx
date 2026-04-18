"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GanttChartPreview } from "./GanttChartPreview";
import {
  createEmptyTaskForChartType,
  ganttChartTypes,
  getGanttChartTypeConfig,
  getPreviewTasksForChartType,
  getSampleTasksForChartType,
} from "@/lib/gantt/chartTypes";
import {
  getFrappeRangeEnd,
  getTaskDateBounds,
  getTimelineRangeForTasks,
  isTimelineRangeValid,
  snapDateToUnit,
} from "@/lib/gantt/dateUnits";
import {
  addGanttTask,
  applyGanttProgressChange,
  applySafeGanttDatePatch,
  clampProjectTimelineColumnWidth,
  compareDateInputs,
  createGanttDebugSnapshot,
  defaultGanttTaskColor,
  defaultProjectMonthColumnWidth,
  defaultProjectWeekColumnWidth,
  formatDateForInput,
  ganttBackgroundTemplateOptions,
  ganttTaskColorOptions,
  getDefaultProjectTimelineColumnWidth,
  getProjectTimelineColumnWidthRange,
  getValidPreviewTasks,
  isValidGanttTaskColor,
  isValidDateObject,
  milestoneTaskStatusOptions,
  normalizeGanttTaskColor,
  parseDependencyInput,
  removeGanttTask,
  isValidDateInput,
  updateGanttTask,
  updateGanttTaskId,
  validateGanttTasks,
  wbsNodeTypeOptions,
  type GanttChartType,
  type GanttEditorShellState,
  type GanttTask,
  type GanttTaskField,
  type GanttViewMode,
  type WbsNodeType,
} from "@/lib/gantt/taskModel";
import {
  createGanttDebugPayload,
  readGanttDebugEnabled,
  recordGanttDebugEvent,
} from "@/lib/gantt/debug";
import {
  inlineSvgPresentationStyles,
  stabilizeSvgAnimations,
} from "@/lib/gantt/svgExport";
import { resolveGanttTaskVisual } from "@/lib/gantt/taskColorResolver";
import {
  defaultGanttPalette,
  getGanttPaletteCssVariables,
} from "@/lib/gantt/theme";

type GeneratedGanttImage = {
  dataUrl: string;
  fileName: string;
};

type PreparedExportTarget = {
  cleanup: () => void;
  height: number;
  node: HTMLElement;
  width: number;
};

const viewModes: Array<{ label: string; viewMode: GanttViewMode }> = [
  { label: "1일 단위", viewMode: "Day" },
  { label: "주 단위", viewMode: "Week" },
  { label: "월 단위", viewMode: "Month" },
  { label: "분기 단위", viewMode: "Quarter" },
];

const allIssueFields: GanttTaskField[] = [
  "id",
  "name",
  "start",
  "end",
  "date",
  "progress",
  "section",
  "phase",
  "owner",
  "status",
  "baselineStart",
  "baselineEnd",
  "color",
  "code",
  "parentId",
  "nodeType",
  "stage",
  "dependsOn",
  "notes",
  "critical",
  "open",
  "dependencies",
];

const initialChartType: GanttChartType = "project";
const initialTasks = getSampleTasksForChartType(initialChartType);
const initialViewMode =
  getGanttChartTypeConfig(initialChartType).defaultViewMode;
const initialTimelineRange = getTimelineRangeForTasks(
  initialTasks,
  initialViewMode,
);
const imageExportTimeoutMs = 6000;
const fallbackImagePixelRatio = 2;
const fallbackImageMinChartWidth = 480;
const fallbackDayColumnWidth = 34;
const fallbackQuarterColumnWidth = 128;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      timeoutMs,
    );

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

function parseInputDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function addMonths(date: Date, months: number): Date {
  const nextDate = new Date(date);

  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
}

function getFallbackTimelineColumns(
  timelineStart: string,
  timelineEnd: string,
  viewMode: GanttViewMode,
) {
  const start = parseInputDate(timelineStart);
  const end = parseInputDate(timelineEnd);
  const columns: Array<{
    start: Date;
    end: Date;
    label: string;
    group: string;
  }> = [];
  let cursor = new Date(start);

  while (cursor <= end && columns.length < 240) {
    const columnStart = new Date(cursor);
    const columnEnd =
      viewMode === "Day"
        ? addDays(columnStart, 1)
        : viewMode === "Week"
          ? addDays(columnStart, 7)
          : viewMode === "Month"
            ? addMonths(columnStart, 1)
            : addMonths(columnStart, 3);
    const monthLabel = `${columnStart.getFullYear()}-${String(
      columnStart.getMonth() + 1,
    ).padStart(2, "0")}`;
    const weekLabel = `${Math.floor((columnStart.getDate() - 1) / 7) + 1}주`;
    const quarterLabel = `${columnStart.getFullYear()} Q${
      Math.floor(columnStart.getMonth() / 3) + 1
    }`;

    columns.push({
      start: columnStart,
      end: columnEnd,
      group:
        viewMode === "Day" || viewMode === "Week"
          ? monthLabel
          : String(columnStart.getFullYear()),
      label:
        viewMode === "Day"
          ? String(columnStart.getDate()).padStart(2, "0")
          : viewMode === "Week"
            ? weekLabel
            : viewMode === "Month"
              ? monthLabel
              : quarterLabel,
    });
    cursor = columnEnd;
  }

  return columns;
}

function getTaskFallbackStart(task: GanttTask): string {
  return task.date || task.start || task.end;
}

function getTaskFallbackEnd(task: GanttTask): string {
  return task.date || task.end || task.start;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
  if (context.strokeStyle !== "transparent") {
    context.stroke();
  }
}

function drawDiamond(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  context.beginPath();
  context.moveTo(x, y - size / 2);
  context.lineTo(x + size / 2, y);
  context.lineTo(x, y + size / 2);
  context.lineTo(x - size / 2, y);
  context.closePath();
  context.fill();
}

function getFallbackTimelineLineStyle(
  columns: Array<{
    start: Date;
    end: Date;
    label: string;
    group: string;
  }>,
  index: number,
) {
  const isGroupBoundary =
    index === 0 || columns[index - 1]?.group !== columns[index]?.group;

  return isGroupBoundary
    ? {
        color: defaultGanttPalette.neutral.textSecondary,
        width: 1.35,
      }
    : {
        color: defaultGanttPalette.neutral.secondaryBar,
        width: 0.9,
        dash: [4, 4],
      };
}

function drawCanvasVerticalLine(
  context: CanvasRenderingContext2D,
  x: number,
  yStart: number,
  yEnd: number,
  options?: {
    color?: string;
    width?: number;
    dash?: number[];
  },
) {
  context.save();
  context.strokeStyle = options?.color ?? defaultGanttPalette.neutral.gridLine;
  context.lineWidth = options?.width ?? 1;
  context.setLineDash(options?.dash ?? []);
  context.beginPath();
  context.moveTo(x, yStart);
  context.lineTo(x, yEnd);
  context.stroke();
  context.restore();
}

function getCanvasFallbackColumnWidth(
  viewMode: GanttViewMode,
  weekColumnWidth: number,
  monthColumnWidth: number,
) {
  if (viewMode === "Week") {
    return weekColumnWidth;
  }

  if (viewMode === "Month") {
    return monthColumnWidth;
  }

  if (viewMode === "Quarter") {
    return fallbackQuarterColumnWidth;
  }

  return fallbackDayColumnWidth;
}

function createCanvasFallbackImage({
  chartType,
  monthColumnWidth,
  previewTasks,
  showSidebar = true,
  timelineEnd,
  timelineStart,
  viewMode,
  weekColumnWidth,
}: {
  chartType: GanttChartType;
  monthColumnWidth: number;
  previewTasks: GanttTask[];
  showSidebar?: boolean;
  timelineEnd: string;
  timelineStart: string;
  viewMode: GanttViewMode;
  weekColumnWidth: number;
}): string {
  const rowHeight = 48;
  const headerHeight = 85;
  const leftPadding = showSidebar ? 20 : 0;
  const leftColumnWidth = showSidebar ? 236 : 0;
  const chartPaddingRight = showSidebar ? 20 : 0;
  const bottomPadding = showSidebar ? 18 : 8;
  const resolvedTimelineEnd =
    chartType === "project"
      ? getFrappeRangeEnd(timelineEnd, viewMode)
      : timelineEnd;
  const columns = getFallbackTimelineColumns(
    timelineStart,
    resolvedTimelineEnd,
    viewMode,
  );
  const preferredColumnWidth = getCanvasFallbackColumnWidth(
    viewMode,
    weekColumnWidth,
    monthColumnWidth,
  );
  const chartWidth = Math.max(
    fallbackImageMinChartWidth,
    Math.max(columns.length, 1) * preferredColumnWidth,
  );
  const timelineXStart = leftPadding + leftColumnWidth;
  const imageWidth = timelineXStart + chartWidth + chartPaddingRight;
  const imageHeight =
    headerHeight + Math.max(previewTasks.length, 1) * rowHeight + bottomPadding;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("canvas context unavailable");
  }

  canvas.width = imageWidth * fallbackImagePixelRatio;
  canvas.height = imageHeight * fallbackImagePixelRatio;
  canvas.style.width = `${imageWidth}px`;
  canvas.style.height = `${imageHeight}px`;
  context.scale(fallbackImagePixelRatio, fallbackImagePixelRatio);

  context.fillStyle = defaultGanttPalette.neutral.background;
  context.fillRect(0, 0, imageWidth, imageHeight);

  context.fillStyle = defaultGanttPalette.neutral.surface;
  context.fillRect(0, 0, imageWidth, headerHeight);
  context.fillStyle = defaultGanttPalette.neutral.rowDivider;
  context.fillRect(0, headerHeight - 1, imageWidth, 1);

  const rangeStartTime = parseInputDate(timelineStart).getTime();
  const rangeEndTime = addDays(parseInputDate(timelineEnd), 1).getTime();
  const rangeDuration = Math.max(1, rangeEndTime - rangeStartTime);
  const columnWidth = chartWidth / Math.max(columns.length, 1);
  const guideLineTop = 0;
  const guideLineBottom = imageHeight;

  if (showSidebar) {
    drawCanvasVerticalLine(context, timelineXStart, 0, imageHeight, {
      color: defaultGanttPalette.neutral.rowDivider,
      width: 1,
    });
  }

  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 12px Arial, sans-serif";
  columns.forEach((column, index) => {
    const x = timelineXStart + index * columnWidth;
    const lineStyle = getFallbackTimelineLineStyle(columns, index);

    drawCanvasVerticalLine(
      context,
      x,
      guideLineTop,
      guideLineBottom,
      lineStyle,
    );

    context.fillStyle = defaultGanttPalette.neutral.textSecondary;
    context.fillText(column.label, x + columnWidth / 2, 49);
  });
  context.font = "700 13px Arial, sans-serif";

  let groupStartIndex = 0;

  while (groupStartIndex < columns.length) {
    const group = columns[groupStartIndex]?.group ?? "";
    let groupEndIndex = groupStartIndex;

    while (
      groupEndIndex + 1 < columns.length &&
      columns[groupEndIndex + 1]?.group === group
    ) {
      groupEndIndex += 1;
    }

    const groupStartX = timelineXStart + groupStartIndex * columnWidth;
    const groupWidth = (groupEndIndex - groupStartIndex + 1) * columnWidth;

    context.fillStyle = defaultGanttPalette.neutral.textPrimary;
    context.fillText(group, groupStartX + groupWidth / 2, 22);
    groupStartIndex = groupEndIndex + 1;
  }

  context.restore();

  if (showSidebar) {
    context.fillStyle = defaultGanttPalette.neutral.textSecondary;
    context.font = "700 11px Arial, sans-serif";
    context.fillText("Task", leftPadding, 23);
    context.fillText("Owner", leftPadding, 52);
  }

  previewTasks.forEach((task, index) => {
    const rowTop = headerHeight + index * rowHeight;
    const rowMiddle = rowTop + rowHeight / 2;
    const visual = resolveGanttTaskVisual(task, {
      chartType,
      palette: defaultGanttPalette,
    });
    const start = parseInputDate(getTaskFallbackStart(task));
    const end = parseInputDate(getTaskFallbackEnd(task));
    const isMilestone =
      chartType === "milestones" || task.nodeType === "milestone";
    const isGroup = task.nodeType === "group";

    if (index % 2 === 0) {
      context.fillStyle = defaultGanttPalette.neutral.surface;
      context.fillRect(0, rowTop, imageWidth, rowHeight);
    }

    context.strokeStyle = defaultGanttPalette.neutral.rowDivider;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, rowTop);
    context.lineTo(imageWidth, rowTop);
    context.stroke();

    if (showSidebar) {
      context.fillStyle = defaultGanttPalette.neutral.textPrimary;
      context.font = isGroup
        ? "700 13px Arial, sans-serif"
        : "13px Arial, sans-serif";
      context.fillText(
        task.name,
        leftPadding,
        rowMiddle + 2,
        leftColumnWidth - 16,
      );

      if (task.owner) {
        context.fillStyle = defaultGanttPalette.neutral.textSecondary;
        context.font = "12px Arial, sans-serif";
        context.fillText(
          task.owner,
          leftPadding,
          rowMiddle + 18,
          leftColumnWidth - 16,
        );
      }
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    const startRatio = Math.max(
      0,
      Math.min(1, (start.getTime() - rangeStartTime) / rangeDuration),
    );
    const endRatio = Math.max(
      startRatio,
      Math.min(1, (addDays(end, 1).getTime() - rangeStartTime) / rangeDuration),
    );
    const barX = timelineXStart + chartWidth * startRatio;
    const barWidth = Math.max(8, chartWidth * (endRatio - startRatio));

    if (isMilestone) {
      context.fillStyle = defaultGanttPalette.semantic.milestone;
      drawDiamond(context, barX, rowMiddle, 18);
      return;
    }

    if (isGroup) {
      context.fillStyle = defaultGanttPalette.neutral.groupBar;
      context.strokeStyle = defaultGanttPalette.neutral.groupBar;
      drawRoundedRect(
        context,
        barX,
        rowMiddle - 5,
        Math.max(barWidth, 48),
        10,
        5,
      );
      return;
    }

    context.fillStyle = visual.remainingColor;
    context.strokeStyle = visual.borderColor;
    drawRoundedRect(context, barX, rowMiddle - 8, barWidth, 16, 5);

    context.fillStyle = visual.progressColor;
    context.strokeStyle = "transparent";
    drawRoundedRect(
      context,
      barX,
      rowMiddle - 8,
      Math.max(4, (barWidth * Math.min(100, Math.max(0, task.progress))) / 100),
      16,
      5,
    );
  });

  return canvas.toDataURL("image/png");
}

function preparePreviewExportTarget(source: HTMLElement): PreparedExportTarget {
  const sourceRect = source.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(sourceRect.width));
  const height = Math.max(1, Math.ceil(sourceRect.height));
  const exportBackground = defaultGanttPalette.neutral.background;

  if (width <= 0 || height <= 0) {
    throw new Error("invalid export target size");
  }

  const shell = document.createElement("div");
  const clone = source.cloneNode(true) as HTMLElement;

  shell.style.position = "fixed";
  shell.style.left = "-100000px";
  shell.style.top = "0";
  shell.style.zIndex = "-1";
  shell.style.pointerEvents = "none";
  shell.style.overflow = "hidden";
  shell.style.background = exportBackground;
  shell.style.width = `${width}px`;
  shell.style.height = `${height}px`;

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.maxHeight = `${height}px`;
  clone.style.overflow = "hidden";
  clone.style.background = exportBackground;

  shell.appendChild(clone);
  document.body.appendChild(shell);

  const sourceNodes = [
    source,
    ...Array.from(source.querySelectorAll<HTMLElement>("*")),
  ];
  const cloneNodes = [
    clone,
    ...Array.from(clone.querySelectorAll<HTMLElement>("*")),
  ];

  sourceNodes.forEach((sourceNode, index) => {
    const cloneNode = cloneNodes[index];

    if (!cloneNode) {
      return;
    }

    if (sourceNode.scrollLeft !== 0 || sourceNode.scrollTop !== 0) {
      cloneNode.scrollLeft = sourceNode.scrollLeft;
      cloneNode.scrollTop = sourceNode.scrollTop;
    }
  });

  clone
    .querySelectorAll<HTMLElement>(
      ".gantt-preview, .gantt-preview-canvas, .gantt-container",
    )
    .forEach((node) => {
      node.style.background = exportBackground;
      node.style.backgroundColor = exportBackground;
    });
  clone.querySelectorAll<SVGSVGElement>("svg.gantt").forEach((node) => {
    node.style.background = exportBackground;
    node.style.backgroundColor = exportBackground;
  });
  inlineSvgPresentationStyles(source, clone);

  stabilizeSvgAnimations(clone);

  return {
    cleanup: () => shell.remove(),
    height,
    node: shell,
    width,
  };
}

function getFieldIssue(
  issues: ReturnType<typeof validateGanttTasks>,
  taskId: string,
  field: GanttTaskField,
): string | undefined {
  return issues.find(
    (issue) => issue.taskId === taskId && issue.field === field,
  )?.message;
}

function DateUnitInput({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      aria-label={ariaLabel}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function GanttEditorShell() {
  const [state, setState] = useState<GanttEditorShellState>({
    tasks: initialTasks,
    chartType: initialChartType,
    viewMode: initialViewMode,
    timelineStart: initialTimelineRange.start,
    timelineEnd: initialTimelineRange.end,
    backgroundTemplate: "clean",
    weekColumnWidth: defaultProjectWeekColumnWidth,
    monthColumnWidth: defaultProjectMonthColumnWidth,
    selectedTaskId: initialTasks[0]?.id,
  });
  const [debugEnabled] = useState(() => readGanttDebugEnabled());
  const [exportStatus, setExportStatus] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [colorDialogTaskId, setColorDialogTaskId] = useState<string | null>(
    null,
  );
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const previewRef = useRef<HTMLDivElement>(null);
  const taskRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const issues = useMemo(
    () => validateGanttTasks(state.tasks, state.chartType),
    [state.chartType, state.tasks],
  );
  const chartTypeConfig = getGanttChartTypeConfig(state.chartType);
  const validTasks = useMemo(
    () => getValidPreviewTasks(state.tasks, state.chartType),
    [state.chartType, state.tasks],
  );
  const previewTasks = useMemo(
    () =>
      state.chartType === "project"
        ? getPreviewTasksForChartType(validTasks, state.chartType)
        : validTasks,
    [state.chartType, validTasks],
  );
  const snapshot = useMemo(() => createGanttDebugSnapshot(state), [state]);
  const timelineIssue = isTimelineRangeValid({
    start: state.timelineStart,
    end: state.timelineEnd,
  })
    ? ""
    : "표시 범위의 시작은 종료보다 빠르거나 같아야 합니다.";
  const hasIssues = issues.length > 0;
  const canExport = previewTasks.length > 0 && !hasIssues && !timelineIssue;
  const colorDialogTask = useMemo(
    () => state.tasks.find((task) => task.id === colorDialogTaskId),
    [colorDialogTaskId, state.tasks],
  );
  const canApplyDraftColor = isValidGanttTaskColor(draftColor);
  const previewDraftColor = canApplyDraftColor
    ? normalizeGanttTaskColor(draftColor)
    : defaultGanttTaskColor;
  const ganttThemeStyle = useMemo(
    () => getGanttPaletteCssVariables(defaultGanttPalette) as CSSProperties,
    [],
  );
  const timelineScaleMode =
    state.chartType === "project" &&
    (state.viewMode === "Week" || state.viewMode === "Month")
      ? state.viewMode
      : null;
  const timelineScaleValue = timelineScaleMode
    ? timelineScaleMode === "Week"
      ? state.weekColumnWidth
      : state.monthColumnWidth
    : getDefaultProjectTimelineColumnWidth("Week");
  const timelineScaleRange = timelineScaleMode
    ? getProjectTimelineColumnWidthRange(timelineScaleMode)
    : null;

  useEffect(() => {
    recordGanttDebugEvent(
      debugEnabled,
      "state.snapshot",
      createGanttDebugPayload(snapshot),
    );
  }, [debugEnabled, snapshot]);

  useEffect(() => {
    if (!colorDialogTaskId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setColorDialogTaskId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [colorDialogTaskId]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 2600);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  function syncTimelineRangeToTasks(
    nextState: GanttEditorShellState,
  ): GanttEditorShellState {
    if (nextState.tasks.length === 0) {
      return nextState;
    }

    const taskBounds = getTaskDateBounds(nextState.tasks);

    if (!taskBounds) {
      return nextState;
    }

    const fallbackRange = getTimelineRangeForTasks(
      nextState.tasks,
      nextState.viewMode,
    );
    const timelineStart = !isValidDateInput(nextState.timelineStart)
      ? fallbackRange.start
      : compareDateInputs(taskBounds.start, nextState.timelineStart) < 0
        ? snapDateToUnit(taskBounds.start, nextState.viewMode, "start")
        : nextState.timelineStart;
    const timelineEnd = !isValidDateInput(nextState.timelineEnd)
      ? fallbackRange.end
      : compareDateInputs(taskBounds.end, nextState.timelineEnd) > 0
        ? taskBounds.end
        : nextState.timelineEnd;

    if (
      timelineStart === nextState.timelineStart &&
      timelineEnd === nextState.timelineEnd
    ) {
      return nextState;
    }

    return {
      ...nextState,
      timelineStart,
      timelineEnd,
    };
  }

  function updateState(nextState: GanttEditorShellState, reason: string) {
    const resolvedState = syncTimelineRangeToTasks(nextState);

    setExportStatus("");
    setState(resolvedState);
    recordGanttDebugEvent(
      debugEnabled,
      reason,
      createGanttDebugPayload(createGanttDebugSnapshot(resolvedState)),
    );
  }

  function setTaskRowRef(taskId: string, element: HTMLDivElement | null) {
    if (element) {
      taskRowRefs.current.set(taskId, element);
      return;
    }

    taskRowRefs.current.delete(taskId);
  }

  function focusTaskEditor(taskId: string) {
    window.requestAnimationFrame(() => {
      const row = taskRowRefs.current.get(taskId);

      if (!row) {
        return;
      }

      row.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      row.querySelector<HTMLElement>("input, select, textarea")?.focus({
        preventScroll: true,
      });
    });
  }

  function getCurrentTask(taskId: string) {
    return state.tasks.find((task) => task.id === taskId);
  }

  function getTaskDisplayColor(task: GanttTask) {
    return resolveGanttTaskVisual(task, {
      chartType: state.chartType,
      palette: defaultGanttPalette,
    }).baseColor;
  }

  function handleTaskChange(
    taskId: string,
    field: keyof GanttTask,
    value: GanttTask[keyof GanttTask],
  ) {
    const patch = {
      [field]: value,
    } as Partial<GanttTask>;

    if (field === "id") {
      const nextId = String(value);
      const nextTasks = updateGanttTaskId(state.tasks, taskId, nextId);

      updateState(
        {
          ...state,
          tasks: nextTasks,
          selectedTaskId: nextId,
        },
        "task.id.change",
      );
      return;
    }

    if (field === "date") {
      patch.start = String(value);
      patch.end = String(value);
    }

    if (field === "start" && state.chartType === "milestones") {
      patch.date = String(value);
      patch.end = String(value);
    }

    if (field === "nodeType") {
      const nodeType = value as WbsNodeType;
      const currentTask = getCurrentTask(taskId);
      const baseDate =
        currentTask?.date ||
        currentTask?.start ||
        state.timelineStart ||
        formatDateForInput(new Date());

      if (nodeType === "group") {
        patch.start = "";
        patch.end = "";
        patch.date = "";
        patch.progress = 0;
      }

      if (nodeType === "milestone") {
        patch.date = baseDate;
        patch.start = baseDate;
        patch.end = baseDate;
        patch.progress = 100;
      }

      if (nodeType === "task") {
        patch.start = currentTask?.start || baseDate;
        patch.end = currentTask?.end || baseDate;
        patch.date = currentTask?.date || baseDate;
        patch.progress = currentTask?.progress ?? 0;
      }
    }

    const nextTasks = updateGanttTask(state.tasks, taskId, patch);

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: taskId,
      },
      `task.${String(field)}.change`,
    );
  }

  function handleDependenciesChange(taskId: string, value: string) {
    const dependencies = parseDependencyInput(value, taskId);

    handleTaskChange(
      taskId,
      state.chartType === "project" ? "dependencies" : "dependsOn",
      dependencies.length > 0 ? dependencies : [],
    );
  }

  function handleTaskDateChange(
    taskId: string,
    field: "start" | "end" | "date",
    value: string,
  ) {
    const currentTask = getCurrentTask(taskId);
    const patch = {
      [field]: value,
    } as Partial<GanttTask>;

    if (field === "date" || state.chartType === "milestones") {
      patch.date = value;
      patch.start = value;
      patch.end = value;
    }

    if (state.chartType === "wbs") {
      if (currentTask?.nodeType === "milestone") {
        patch.date = value;
        patch.start = value;
        patch.end = value;
      }
    }

    if (
      field === "start" &&
      currentTask &&
      isValidDateInput(value) &&
      isValidDateInput(currentTask.end) &&
      compareDateInputs(value, currentTask.end) > 0
    ) {
      patch.end = value;
    }

    if (
      field === "end" &&
      currentTask &&
      isValidDateInput(value) &&
      isValidDateInput(currentTask.start) &&
      compareDateInputs(value, currentTask.start) < 0
    ) {
      setToastMessage("종료일은 시작일보다 빠를 수 없습니다.");
      recordGanttDebugEvent(debugEnabled, "task.end.invalid_blocked", {
        taskId,
        start: currentTask.start,
        end: value,
      });
      focusTaskEditor(taskId);
      return;
    }

    const nextTasks = updateGanttTask(state.tasks, taskId, patch);

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: taskId,
      },
      `task.${field}.change`,
    );
  }

  function handleAddTask() {
    const nextTasks = addGanttTask(
      state.tasks,
      createEmptyTaskForChartType(
        state.tasks,
        state.chartType,
        state.timelineStart,
      ),
    );
    const addedTask = nextTasks[nextTasks.length - 1];

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: addedTask?.id,
      },
      "task.add",
    );
  }

  function handleRemoveTask(taskId: string) {
    const nextTasks = removeGanttTask(state.tasks, taskId);

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: nextTasks[0]?.id,
      },
      "task.remove",
    );
  }

  function handleResetSample() {
    const nextTasks = getSampleTasksForChartType(state.chartType);
    const nextTimelineRange = getTimelineRangeForTasks(
      nextTasks,
      chartTypeConfig.defaultViewMode,
    );

    updateState(
      {
        ...state,
        tasks: nextTasks,
        viewMode: chartTypeConfig.defaultViewMode,
        timelineStart: nextTimelineRange.start,
        timelineEnd: nextTimelineRange.end,
        backgroundTemplate: state.backgroundTemplate,
        selectedTaskId: nextTasks[0]?.id,
      },
      "tasks.reset_sample",
    );
  }

  function handleClearTasks() {
    updateState(
      {
        ...state,
        tasks: [],
        selectedTaskId: undefined,
      },
      "tasks.clear",
    );
  }

  function handleViewModeChange(viewMode: GanttViewMode) {
    updateState(
      {
        ...state,
        viewMode,
      },
      "view_mode.change",
    );
  }

  function handleTimelineRangeChange(
    field: "timelineStart" | "timelineEnd",
    value: string,
  ) {
    updateState(
      {
        ...state,
        [field]: value,
      },
      `timeline.${field}.change`,
    );
  }

  function handleChartTypeChange(chartType: GanttChartType) {
    const config = getGanttChartTypeConfig(chartType);
    const nextTasks = getSampleTasksForChartType(chartType);
    const nextTimelineRange = getTimelineRangeForTasks(
      nextTasks,
      config.defaultViewMode,
    );

    updateState(
      {
        tasks: nextTasks,
        chartType,
        viewMode: config.defaultViewMode,
        timelineStart: nextTimelineRange.start,
        timelineEnd: nextTimelineRange.end,
        backgroundTemplate: state.backgroundTemplate,
        weekColumnWidth: state.weekColumnWidth,
        monthColumnWidth: state.monthColumnWidth,
        selectedTaskId: nextTasks[0]?.id,
      },
      "chart_type.change",
    );
  }

  function handleDateChange(taskId: string, start: Date, end: Date) {
    if (!isValidDateObject(start) || !isValidDateObject(end)) {
      recordGanttDebugEvent(debugEnabled, "chart.date_change.reverted", {
        taskId,
        reason: "invalid_date_object",
        start: String(start),
        end: String(end),
      });
      handlePreviewTaskSelect(taskId);
      return;
    }

    const nextStart = snapDateToUnit(
      formatDateForInput(start),
      state.viewMode,
      "start",
    );
    const nextEnd = snapDateToUnit(
      formatDateForInput(end),
      state.viewMode,
      "end",
    );
    const patchResult = applySafeGanttDatePatch(
      state.tasks,
      taskId,
      nextStart,
      nextEnd,
    );

    if (!patchResult.applied) {
      recordGanttDebugEvent(debugEnabled, "chart.date_change.reverted", {
        taskId,
        reason: patchResult.reason,
        start: nextStart,
        end: nextEnd,
      });
      handlePreviewTaskSelect(taskId);
      return;
    }

    updateState(
      {
        ...state,
        tasks: patchResult.tasks,
        selectedTaskId: taskId,
      },
      "chart.date_change",
    );
  }

  function handleProgressChange(taskId: string, progress: number) {
    updateState(
      {
        ...state,
        tasks: applyGanttProgressChange(state.tasks, taskId, progress),
        selectedTaskId: taskId,
      },
      "chart.progress_change",
    );
  }

  function handleBackgroundTemplateChange(value: string) {
    updateState(
      {
        ...state,
        backgroundTemplate:
          ganttBackgroundTemplateOptions.find(
            (option) => option.value === value,
          )?.value ?? "clean",
      },
      "background_template.change",
    );
  }

  function handleTimelineScaleChange(nextWidth: number) {
    if (!timelineScaleMode) {
      return;
    }

    const clampedWidth = clampProjectTimelineColumnWidth(
      timelineScaleMode,
      nextWidth,
    );

    updateState(
      {
        ...state,
        weekColumnWidth:
          timelineScaleMode === "Week" ? clampedWidth : state.weekColumnWidth,
        monthColumnWidth:
          timelineScaleMode === "Month" ? clampedWidth : state.monthColumnWidth,
      },
      "timeline.column_width.change",
    );
  }

  function openColorPicker(task: GanttTask) {
    const color = isValidGanttTaskColor(task.color)
      ? normalizeGanttTaskColor(task.color)
      : getTaskDisplayColor(task);

    setDraftColor(color);
    setColorDialogTaskId(task.id);
    recordGanttDebugEvent(debugEnabled, "color_picker.open", {
      taskId: task.id,
      color,
    });
  }

  function closeColorPicker() {
    setColorDialogTaskId(null);
  }

  function handleDraftColorChange(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setDraftColor("");
      return;
    }

    setDraftColor(
      trimmedValue.startsWith("#")
        ? trimmedValue.toUpperCase()
        : `#${trimmedValue.toUpperCase()}`,
    );
  }

  function handleApplyColor() {
    if (!colorDialogTask || !canApplyDraftColor) {
      return;
    }

    handleTaskChange(
      colorDialogTask.id,
      "color",
      normalizeGanttTaskColor(draftColor),
    );
    closeColorPicker();
  }

  function handlePreviewTaskSelect(taskId: string) {
    setState((current) => {
      if (current.selectedTaskId === taskId) {
        recordGanttDebugEvent(debugEnabled, "chart.select_task_for_edit.skip", {
          selectedTaskId: taskId,
        });
        return current;
      }

      const nextState = {
        ...current,
        selectedTaskId: taskId,
      };

      recordGanttDebugEvent(
        debugEnabled,
        "chart.select_task_for_edit",
        createGanttDebugPayload(createGanttDebugSnapshot(nextState)),
      );

      return nextState;
    });
    focusTaskEditor(taskId);
  }

  function getImageFileName() {
    const datePart = new Date().toISOString().slice(0, 10);

    return `office-tool-${state.chartType}-gantt-${datePart}.png`;
  }

  function downloadGeneratedImage(image: GeneratedGanttImage) {
    const link = document.createElement("a");

    link.download = image.fileName;
    link.href = image.dataUrl;
    link.click();
    setExportStatus("차트 이미지 다운로드가 시작되었습니다.");
    recordGanttDebugEvent(debugEnabled, "export.image.download", {
      byteLength: image.dataUrl.length,
      fileName: image.fileName,
    });
  }

  async function createPreviewImage(): Promise<GeneratedGanttImage | null> {
    if (!previewRef.current || !canExport) {
      return null;
    }

    function createImageState(dataUrl: string): GeneratedGanttImage {
      return {
        dataUrl,
        fileName: getImageFileName(),
      };
    }

    setExportStatus("차트 이미지를 내보내는 중입니다.");
    recordGanttDebugEvent(debugEnabled, "export.image.start", {
      taskCount: previewTasks.length,
    });

    try {
      const { toPng } = await import("html-to-image");
      const preparedTarget = preparePreviewExportTarget(previewRef.current);

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      let dataUrl = "";

      try {
        dataUrl = await withTimeout(
          toPng(preparedTarget.node, {
            backgroundColor: defaultGanttPalette.neutral.background,
            pixelRatio: 2,
            cacheBust: true,
            skipFonts: true,
            style: {
              background: defaultGanttPalette.neutral.background,
            },
            width: preparedTarget.width,
            height: preparedTarget.height,
          }),
          imageExportTimeoutMs,
          "image export timeout",
        );
      } finally {
        preparedTarget.cleanup();
      }
      const image = createImageState(dataUrl);

      setExportStatus("차트 이미지를 준비했습니다.");
      recordGanttDebugEvent(debugEnabled, "export.image.success", {
        byteLength: dataUrl.length,
        fileName: image.fileName,
      });

      return image;
    } catch (error) {
      recordGanttDebugEvent(debugEnabled, "export.image.error", {
        message: error instanceof Error ? error.message : String(error),
      });

      if (state.chartType === "project") {
        setExportStatus(
          "차트 preview 캡처에 실패했습니다. preview를 다시 확인하세요.",
        );
        recordGanttDebugEvent(debugEnabled, "export.image.project_failed", {
          message: error instanceof Error ? error.message : String(error),
        });

        return null;
      }

      try {
        const image = createImageState(
          createCanvasFallbackImage({
            chartType: state.chartType,
            monthColumnWidth: state.monthColumnWidth,
            previewTasks,
            timelineEnd: state.timelineEnd,
            timelineStart: state.timelineStart,
            viewMode: state.viewMode,
            weekColumnWidth: state.weekColumnWidth,
          }),
        );

        setExportStatus(
          "미리보기 캡처가 지연되어 차트 fallback 이미지를 준비했습니다.",
        );
        recordGanttDebugEvent(debugEnabled, "export.image.fallback_success", {
          byteLength: image.dataUrl.length,
          fileName: image.fileName,
          reason: error instanceof Error ? error.message : String(error),
        });

        return image;
      } catch (fallbackError) {
        setExportStatus(
          "차트 이미지 생성에 실패했습니다. preview를 다시 확인하세요.",
        );
        recordGanttDebugEvent(debugEnabled, "export.image.fallback_error", {
          message:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });

        return null;
      }
    }
  }

  async function handleExportImage() {
    const image = await createPreviewImage();

    if (!image) {
      return;
    }

    downloadGeneratedImage(image);
  }

  function renderIssueMessages(task: GanttTask) {
    return allIssueFields.map((field) => {
      const message = getFieldIssue(issues, task.id, field);

      return message ? (
        <p className="field-error" key={field}>
          {message}
        </p>
      ) : null;
    });
  }

  function renderProjectTaskRow(task: GanttTask) {
    const displayColor = getTaskDisplayColor(task);

    return (
      <>
        <label>
          <span>Task</span>
          <input
            aria-label={`${task.name} 작업명`}
            value={task.name}
            onChange={(event) =>
              handleTaskChange(task.id, "name", event.target.value)
            }
          />
        </label>
        <label>
          <span>Owner</span>
          <input
            aria-label={`${task.name} 담당자`}
            value={task.owner ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "owner", event.target.value)
            }
          />
        </label>
        <label className="color-picker-field">
          <span>색상</span>
          <button
            aria-label={`${task.name} 색상 선택`}
            className="color-picker-trigger"
            type="button"
            onClick={() => openColorPicker(task)}
          >
            <span
              className="color-swatch"
              style={{ backgroundColor: displayColor }}
            />
            <span>{displayColor}</span>
          </button>
        </label>
        <label>
          <span>Start</span>
          <DateUnitInput
            ariaLabel={`${task.name} 시작`}
            value={task.start}
            onChange={(value) => handleTaskDateChange(task.id, "start", value)}
          />
        </label>
        <label>
          <span>End</span>
          <DateUnitInput
            ariaLabel={`${task.name} 종료`}
            value={task.end}
            onChange={(value) => handleTaskDateChange(task.id, "end", value)}
          />
        </label>
        <label>
          <span>Progress</span>
          <input
            aria-label={`${task.name} 진행률`}
            max={100}
            min={0}
            type="number"
            value={task.progress}
            onChange={(event) =>
              handleTaskChange(task.id, "progress", Number(event.target.value))
            }
          />
        </label>
      </>
    );
  }

  function renderMilestoneTaskRow(task: GanttTask) {
    return (
      <>
        <label>
          <span>ID</span>
          <input
            aria-label={`${task.name} id`}
            value={task.id}
            onChange={(event) =>
              handleTaskChange(task.id, "id", event.target.value)
            }
          />
        </label>
        <label>
          <span>Name</span>
          <input
            aria-label={`${task.name} 이름`}
            value={task.name}
            onChange={(event) =>
              handleTaskChange(task.id, "name", event.target.value)
            }
          />
        </label>
        <label>
          <span>Date</span>
          <DateUnitInput
            ariaLabel={`${task.name} 날짜`}
            value={task.date || task.start}
            onChange={(value) => handleTaskDateChange(task.id, "date", value)}
          />
        </label>
        <label>
          <span>Section</span>
          <input
            aria-label={`${task.name} section`}
            value={task.section ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "section", event.target.value)
            }
          />
        </label>
        <label>
          <span>Status</span>
          <select
            aria-label={`${task.name} 상태`}
            value={task.status ?? "planned"}
            onChange={(event) =>
              handleTaskChange(task.id, "status", event.target.value)
            }
          >
            {milestoneTaskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Depends on</span>
          <input
            aria-label={`${task.name} dependsOn`}
            placeholder="ms-scope, ms-design"
            value={(task.dependsOn ?? []).join(", ")}
            onChange={(event) =>
              handleDependenciesChange(task.id, event.target.value)
            }
          />
        </label>
        <label>
          <span>Owner</span>
          <input
            aria-label={`${task.name} 담당자`}
            value={task.owner ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "owner", event.target.value)
            }
          />
        </label>
        <label className="checkbox-field">
          <input
            aria-label={`${task.name} critical`}
            checked={Boolean(task.critical)}
            type="checkbox"
            onChange={(event) =>
              handleTaskChange(task.id, "critical", event.target.checked)
            }
          />
          <span>Critical</span>
        </label>
        <label className="wide-field">
          <span>Notes</span>
          <textarea
            aria-label={`${task.name} notes`}
            value={task.notes ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "notes", event.target.value)
            }
          />
        </label>
      </>
    );
  }

  function renderWbsTaskRow(task: GanttTask) {
    const nodeType = task.nodeType ?? "task";

    return (
      <>
        <label>
          <span>ID</span>
          <input
            aria-label={`${task.name} id`}
            value={task.id}
            onChange={(event) =>
              handleTaskChange(task.id, "id", event.target.value)
            }
          />
        </label>
        <label>
          <span>Code</span>
          <input
            aria-label={`${task.name} code`}
            value={task.code ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "code", event.target.value)
            }
          />
        </label>
        <label>
          <span>Name</span>
          <input
            aria-label={`${task.name} 이름`}
            value={task.name}
            onChange={(event) =>
              handleTaskChange(task.id, "name", event.target.value)
            }
          />
        </label>
        <label>
          <span>Parent</span>
          <select
            aria-label={`${task.name} parentId`}
            value={task.parentId ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "parentId", event.target.value)
            }
          >
            <option value="">상위 없음</option>
            {state.tasks
              .filter((candidate) => candidate.id !== task.id)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.code ? `${candidate.code} ` : ""}
                  {candidate.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>Node type</span>
          <select
            aria-label={`${task.name} nodeType`}
            value={nodeType}
            onChange={(event) =>
              handleTaskChange(
                task.id,
                "nodeType",
                event.target.value as WbsNodeType,
              )
            }
          >
            {wbsNodeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {nodeType === "milestone" ? (
          <label>
            <span>Date</span>
            <DateUnitInput
              ariaLabel={`${task.name} 날짜`}
              value={task.date || task.start}
              onChange={(value) => handleTaskDateChange(task.id, "date", value)}
            />
          </label>
        ) : null}
        {nodeType === "task" ? (
          <>
            <label>
              <span>Start</span>
              <DateUnitInput
                ariaLabel={`${task.name} 시작`}
                value={task.start}
                onChange={(value) =>
                  handleTaskDateChange(task.id, "start", value)
                }
              />
            </label>
            <label>
              <span>End</span>
              <DateUnitInput
                ariaLabel={`${task.name} 종료`}
                value={task.end}
                onChange={(value) =>
                  handleTaskDateChange(task.id, "end", value)
                }
              />
            </label>
            <label>
              <span>Progress</span>
              <input
                aria-label={`${task.name} 진행률`}
                max={100}
                min={0}
                type="number"
                value={task.progress}
                onChange={(event) =>
                  handleTaskChange(
                    task.id,
                    "progress",
                    Number(event.target.value),
                  )
                }
              />
            </label>
          </>
        ) : null}
        <label>
          <span>Owner</span>
          <input
            aria-label={`${task.name} 담당자`}
            value={task.owner ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "owner", event.target.value)
            }
          />
        </label>
        <label>
          <span>Stage</span>
          <input
            aria-label={`${task.name} stage`}
            value={task.stage ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "stage", event.target.value)
            }
          />
        </label>
        <label>
          <span>Depends on</span>
          <input
            aria-label={`${task.name} dependsOn`}
            placeholder="wbs-schema, wbs-review"
            value={(task.dependsOn ?? []).join(", ")}
            onChange={(event) =>
              handleDependenciesChange(task.id, event.target.value)
            }
          />
        </label>
        {nodeType === "group" ? (
          <label className="checkbox-field">
            <input
              aria-label={`${task.name} open`}
              checked={task.open !== false}
              type="checkbox"
              onChange={(event) =>
                handleTaskChange(task.id, "open", event.target.checked)
              }
            />
            <span>Open</span>
          </label>
        ) : null}
        <label className="wide-field">
          <span>Notes</span>
          <textarea
            aria-label={`${task.name} notes`}
            value={task.notes ?? ""}
            onChange={(event) =>
              handleTaskChange(task.id, "notes", event.target.value)
            }
          />
        </label>
      </>
    );
  }

  return (
    <section className="editor-shell" aria-label="간트 에디터">
      <div className="chart-type-selector" aria-label="간트 타입 선택">
        {ganttChartTypes.map((type) => (
          <button
            aria-pressed={state.chartType === type.id}
            className={state.chartType === type.id ? "active" : ""}
            key={type.id}
            type="button"
            onClick={() => handleChartTypeChange(type.id)}
          >
            <span>{type.name}</span>
            <small>{type.description}</small>
          </button>
        ))}
      </div>

      <div className="action-bar" aria-label="간트 toolbar">
        <button type="button" onClick={handleResetSample}>
          예시 데이터
        </button>
        <button type="button" onClick={handleClearTasks}>
          전체 초기화
        </button>
        <button type="button" disabled={!canExport} onClick={handleExportImage}>
          이미지로 내보내기
        </button>
      </div>

      <div className="timeline-control-bar" aria-label="날짜 단위와 표시 범위">
        <div className="view-mode-group" aria-label="날짜 입력 단위">
          {viewModes.map((item) => (
            <button
              aria-pressed={state.viewMode === item.viewMode}
              className={state.viewMode === item.viewMode ? "active" : ""}
              key={item.viewMode}
              type="button"
              onClick={() => handleViewModeChange(item.viewMode)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="timeline-range-controls">
          <label>
            <span>표시 시작</span>
            <input
              aria-label="표시 시작"
              type="date"
              value={state.timelineStart}
              onChange={(event) =>
                handleTimelineRangeChange("timelineStart", event.target.value)
              }
            />
          </label>
          <label>
            <span>표시 종료</span>
            <input
              aria-label="표시 종료"
              type="date"
              value={state.timelineEnd}
              onChange={(event) =>
                handleTimelineRangeChange("timelineEnd", event.target.value)
              }
            />
          </label>
        </div>
        {timelineIssue ? (
          <p className="timeline-range-error" role="alert">
            {timelineIssue}
          </p>
        ) : null}
        {state.chartType === "project" ? (
          <div className="gantt-style-controls" aria-label="기본 일정표 스타일">
            <label>
              <span>배경 템플릿</span>
              <select
                aria-label="배경 템플릿"
                value={state.backgroundTemplate}
                onChange={(event) =>
                  handleBackgroundTemplateChange(event.target.value)
                }
              >
                {ganttBackgroundTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {timelineScaleMode && timelineScaleRange ? (
              <label className="timeline-scale-control">
                <span>
                  {timelineScaleMode === "Week" ? "주 간격" : "월 간격"}
                </span>
                <div className="timeline-scale-control-row">
                  <input
                    aria-label={
                      timelineScaleMode === "Week"
                        ? "주 간격 조절"
                        : "월 간격 조절"
                    }
                    max={timelineScaleRange.max}
                    min={timelineScaleRange.min}
                    step={1}
                    type="range"
                    value={timelineScaleValue}
                    onChange={(event) =>
                      handleTimelineScaleChange(Number(event.target.value))
                    }
                  />
                  <output>{timelineScaleValue}px</output>
                </div>
              </label>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="editor-layout">
        <section
          className="preview-panel"
          aria-labelledby="gantt-preview-panel"
        >
          <div className="panel-kicker">미리보기</div>
          <h2 id="gantt-preview-panel">{chartTypeConfig.previewTitle}</h2>
          <p>{chartTypeConfig.previewHelp}</p>

          {hasIssues ? (
            <div className="validation-summary" role="alert">
              {issues.length}개의 입력 오류가 있어 유효한 항목만 preview에
              반영합니다.
            </div>
          ) : null}

          <div
            className={`gantt-export-surface gantt-type-${state.chartType} gantt-background-${state.backgroundTemplate}`}
            ref={previewRef}
            style={ganttThemeStyle}
          >
            <GanttChartPreview
              chartType={state.chartType}
              debugEnabled={debugEnabled}
              monthColumnWidth={state.monthColumnWidth}
              tasks={previewTasks}
              timelineEnd={state.timelineEnd}
              timelineStart={state.timelineStart}
              viewMode={state.viewMode}
              weekColumnWidth={state.weekColumnWidth}
              onDateChange={handleDateChange}
              onProgressChange={handleProgressChange}
              onSelectTask={handlePreviewTaskSelect}
            />
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{previewTasks.length}개 항목 preview</span>
            <span>{chartTypeConfig.shortName}</span>
            <span>{state.viewMode} 단위</span>
            <span>
              {state.timelineStart} - {state.timelineEnd}
            </span>
          </div>
          {exportStatus ? (
            <p className="export-status">{exportStatus}</p>
          ) : null}
        </section>

        <section className="edit-panel" aria-labelledby="gantt-editor-panel">
          <div className="edit-panel-heading">
            <div>
              <div className="panel-kicker">일정 입력</div>
              <h2 id="gantt-editor-panel">{chartTypeConfig.editorTitle}</h2>
              <p>{chartTypeConfig.editorHelp}</p>
            </div>
            <button
              className="add-task-button"
              type="button"
              onClick={handleAddTask}
            >
              작업 추가
            </button>
          </div>

          {state.tasks.length === 0 ? (
            <div className="empty-state">
              작업을 추가하면 preview가 표시됩니다.
            </div>
          ) : (
            <div className="task-editor-list" aria-label="간트 작업 목록">
              {state.tasks.map((task) => (
                <div
                  aria-selected={state.selectedTaskId === task.id}
                  className={
                    state.selectedTaskId === task.id
                      ? `task-editor-row type-${state.chartType} selected`
                      : `task-editor-row type-${state.chartType}`
                  }
                  key={task.id}
                  ref={(element) => setTaskRowRef(task.id, element)}
                >
                  {state.chartType === "project"
                    ? renderProjectTaskRow(task)
                    : state.chartType === "milestones"
                      ? renderMilestoneTaskRow(task)
                      : renderWbsTaskRow(task)}
                  <button
                    className="remove-task-button"
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                  >
                    삭제
                  </button>
                  {renderIssueMessages(task)}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {toastMessage ? (
        <div aria-live="polite" className="gantt-toast" role="alert">
          {toastMessage}
        </div>
      ) : null}

      {colorDialogTask ? (
        <div
          className="color-picker-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeColorPicker();
            }
          }}
        >
          <section
            aria-labelledby="gantt-color-picker-title"
            aria-modal="true"
            className="color-picker-dialog"
            role="dialog"
          >
            <header className="color-picker-header">
              <div>
                <div className="panel-kicker">색상</div>
                <h2 id="gantt-color-picker-title">
                  {colorDialogTask.name} 색상 선택
                </h2>
              </div>
              <button
                aria-label="색상 선택 닫기"
                className="modal-close-button"
                type="button"
                onClick={closeColorPicker}
              >
                닫기
              </button>
            </header>

            <p className="color-picker-help">
              프리셋에서 고르거나 직접 색상과 HEX 값을 지정합니다.
            </p>

            <div className="color-picker-current">
              <span
                className="color-picker-current-swatch"
                style={{ backgroundColor: previewDraftColor }}
              />
              <strong>{previewDraftColor}</strong>
            </div>

            <div className="color-preset-grid" aria-label="색상 프리셋">
              {ganttTaskColorOptions.map((option) => (
                <button
                  aria-label={`${option.label} ${option.value}`}
                  aria-pressed={previewDraftColor === option.value}
                  className="color-preset-button"
                  key={option.value}
                  type="button"
                  onClick={() => setDraftColor(option.value)}
                >
                  <span
                    className="color-swatch"
                    style={{ backgroundColor: option.value }}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="custom-color-controls">
              <label>
                <span>직접 선택</span>
                <input
                  aria-label="사용자 지정 색상"
                  type="color"
                  value={previewDraftColor}
                  onChange={(event) =>
                    handleDraftColorChange(event.target.value)
                  }
                />
              </label>
              <label>
                <span>HEX</span>
                <input
                  aria-label="HEX 색상 코드"
                  maxLength={7}
                  placeholder="#5B6EE1"
                  value={draftColor}
                  onChange={(event) =>
                    handleDraftColorChange(event.target.value)
                  }
                />
              </label>
            </div>

            {!canApplyDraftColor ? (
              <p className="field-error" role="alert">
                #RRGGBB 형식의 색상을 입력하세요.
              </p>
            ) : null}

            <footer className="color-picker-actions">
              <button type="button" onClick={closeColorPicker}>
                취소
              </button>
              <button
                className="primary-action"
                disabled={!canApplyDraftColor}
                type="button"
                onClick={handleApplyColor}
              >
                적용
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
