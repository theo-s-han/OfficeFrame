"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GanttChartPreview,
  type GanttChartPreviewHandle,
} from "./GanttChartPreview";
import {
  createEmptyTaskForChartType,
  ganttChartTypes,
  getGanttChartTypeConfig,
  getPreviewTasksForChartType,
  getSampleTasksForChartType,
} from "@/lib/gantt/chartTypes";
import {
  getDateUnitInputValue,
  getQuarterOptionsForRange,
  getTimelineRangeForTasks,
  isTimelineRangeValid,
  resolveDateUnitInputValue,
  snapDateToUnit,
  type QuarterOption,
} from "@/lib/gantt/dateUnits";
import {
  addGanttTask,
  applyGanttProgressChange,
  applySafeGanttDatePatch,
  createGanttDebugSnapshot,
  defaultGanttTaskColor,
  formatDateForInput,
  ganttBackgroundTemplateOptions,
  ganttTaskColorOptions,
  getValidPreviewTasks,
  isValidGanttTaskColor,
  isValidDateObject,
  milestoneTaskStatusOptions,
  normalizeGanttTaskColor,
  parseDependencyInput,
  removeGanttTask,
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
import { resolveGanttTaskVisual } from "@/lib/gantt/taskColorResolver";
import {
  defaultGanttPalette,
  getGanttPaletteCssVariables,
} from "@/lib/gantt/theme";

type GeneratedGanttImage = {
  dataUrl: string;
  fileName: string;
  createdAt: string;
  chartType: GanttChartType;
  taskCount: number;
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
const fallbackImageWidth = 1440;
const fallbackImagePixelRatio = 2;

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

  while (cursor <= end && columns.length < 90) {
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
        viewMode === "Quarter" ? String(columnStart.getFullYear()) : monthLabel,
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

function createCanvasFallbackImage({
  chartType,
  previewTasks,
  timelineEnd,
  timelineStart,
  viewMode,
}: {
  chartType: GanttChartType;
  previewTasks: GanttTask[];
  timelineEnd: string;
  timelineStart: string;
  viewMode: GanttViewMode;
}): string {
  const rowHeight = 46;
  const headerHeight = 74;
  const topPadding = 30;
  const leftColumnWidth = 280;
  const chartPaddingRight = 36;
  const chartWidth = fallbackImageWidth - leftColumnWidth - chartPaddingRight;
  const imageHeight =
    topPadding +
    headerHeight +
    Math.max(previewTasks.length, 1) * rowHeight +
    36;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("canvas context unavailable");
  }

  canvas.width = fallbackImageWidth * fallbackImagePixelRatio;
  canvas.height = imageHeight * fallbackImagePixelRatio;
  canvas.style.width = `${fallbackImageWidth}px`;
  canvas.style.height = `${imageHeight}px`;
  context.scale(fallbackImagePixelRatio, fallbackImagePixelRatio);

  context.fillStyle = defaultGanttPalette.neutral.background;
  context.fillRect(0, 0, fallbackImageWidth, imageHeight);

  context.fillStyle = defaultGanttPalette.neutral.surface;
  context.fillRect(0, 0, fallbackImageWidth, topPadding + headerHeight);

  context.fillStyle = defaultGanttPalette.neutral.textPrimary;
  context.font = "700 24px Arial, sans-serif";
  context.fillText("Gantt Chart", 28, 38);
  context.font = "13px Arial, sans-serif";
  context.fillStyle = defaultGanttPalette.neutral.textSecondary;
  context.fillText(
    `${chartType} / ${viewMode} / ${timelineStart} - ${timelineEnd}`,
    28,
    62,
  );

  const columns = getFallbackTimelineColumns(
    timelineStart,
    timelineEnd,
    viewMode,
  );
  const rangeStartTime = parseInputDate(timelineStart).getTime();
  const rangeEndTime = addDays(parseInputDate(timelineEnd), 1).getTime();
  const rangeDuration = Math.max(1, rangeEndTime - rangeStartTime);
  const columnWidth = chartWidth / Math.max(columns.length, 1);

  context.font = "700 12px Arial, sans-serif";
  columns.forEach((column, index) => {
    const x = leftColumnWidth + index * columnWidth;

    context.strokeStyle = defaultGanttPalette.neutral.gridLine;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, topPadding + 30);
    context.lineTo(x, imageHeight - 20);
    context.stroke();

    context.fillStyle = defaultGanttPalette.neutral.textSecondary;
    context.fillText(column.label, x + 8, topPadding + 58);

    if (index === 0 || columns[index - 1]?.group !== column.group) {
      context.fillStyle = defaultGanttPalette.neutral.textPrimary;
      context.fillText(column.group, x + 8, topPadding + 34);
    }
  });

  previewTasks.forEach((task, index) => {
    const rowTop = topPadding + headerHeight + index * rowHeight;
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

    context.strokeStyle = defaultGanttPalette.neutral.rowDivider;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, rowTop);
    context.lineTo(fallbackImageWidth, rowTop);
    context.stroke();

    context.fillStyle = defaultGanttPalette.neutral.textPrimary;
    context.font = isGroup
      ? "700 13px Arial, sans-serif"
      : "13px Arial, sans-serif";
    context.fillText(task.name, 28, rowMiddle + 4, leftColumnWidth - 52);

    if (task.owner) {
      context.fillStyle = defaultGanttPalette.neutral.textSecondary;
      context.font = "12px Arial, sans-serif";
      context.fillText(task.owner, 28, rowMiddle + 19, leftColumnWidth - 52);
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
    const barX = leftColumnWidth + chartWidth * startRatio;
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
  boundary,
  quarterOptions,
  value,
  viewMode,
  onChange,
}: {
  ariaLabel: string;
  boundary: "start" | "end";
  quarterOptions: QuarterOption[];
  value: string;
  viewMode: GanttViewMode;
  onChange: (value: string) => void;
}) {
  const unitValue = getDateUnitInputValue(value, viewMode);

  if (viewMode === "Quarter") {
    return (
      <select
        aria-label={ariaLabel}
        value={unitValue}
        onChange={(event) =>
          onChange(
            resolveDateUnitInputValue(event.target.value, viewMode, boundary),
          )
        }
      >
        {quarterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      aria-label={ariaLabel}
      type={
        viewMode === "Week" ? "week" : viewMode === "Month" ? "month" : "date"
      }
      value={unitValue}
      onChange={(event) =>
        onChange(
          resolveDateUnitInputValue(event.target.value, viewMode, boundary),
        )
      }
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
    selectedTaskId: initialTasks[0]?.id,
  });
  const [debugEnabled] = useState(() => readGanttDebugEnabled());
  const [exportStatus, setExportStatus] = useState("");
  const [generatedImage, setGeneratedImage] =
    useState<GeneratedGanttImage | null>(null);
  const [colorDialogTaskId, setColorDialogTaskId] = useState<string | null>(
    null,
  );
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const previewRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<GanttChartPreviewHandle>(null);
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
  const quarterOptions = useMemo(
    () =>
      getQuarterOptionsForRange(
        {
          start: state.timelineStart,
          end: state.timelineEnd,
        },
        state.tasks,
      ),
    [state.tasks, state.timelineEnd, state.timelineStart],
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

  function updateState(nextState: GanttEditorShellState, reason: string) {
    setGeneratedImage(null);
    setExportStatus("");
    setState(nextState);
    recordGanttDebugEvent(
      debugEnabled,
      reason,
      createGanttDebugPayload(createGanttDebugSnapshot(nextState)),
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
    const patch = {
      [field]: value,
    } as Partial<GanttTask>;

    if (field === "date" || state.chartType === "milestones") {
      patch.date = value;
      patch.start = value;
      patch.end = value;
    }

    if (state.chartType === "wbs") {
      const task = getCurrentTask(taskId);

      if (task?.nodeType === "milestone") {
        patch.date = value;
        patch.start = value;
        patch.end = value;
      }
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
    setExportStatus("");
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
    setExportStatus("");
  }

  function handleViewModeChange(viewMode: GanttViewMode) {
    updateState(
      {
        ...state,
        viewMode,
        timelineStart: snapDateToUnit(state.timelineStart, viewMode, "start"),
        timelineEnd: snapDateToUnit(state.timelineEnd, viewMode, "end"),
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
        selectedTaskId: nextTasks[0]?.id,
      },
      "chart_type.change",
    );
    setExportStatus("");
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
    setExportStatus("이미지 다운로드가 시작되었습니다.");
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
        createdAt: new Date().toISOString(),
        chartType: state.chartType,
        taskCount: previewTasks.length,
      };
    }

    setExportStatus("이미지를 생성하고 있습니다.");
    recordGanttDebugEvent(debugEnabled, "export.image.start", {
      taskCount: previewTasks.length,
    });

    try {
      const { toPng } = await import("html-to-image");
      const previewWidth = Math.ceil(previewRef.current.scrollWidth);
      const previewHeight = Math.ceil(previewRef.current.scrollHeight);
      const dataUrl = await withTimeout(
        toPng(previewRef.current, {
          backgroundColor: defaultGanttPalette.neutral.background,
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true,
          width: previewWidth,
          height: previewHeight,
          canvasWidth: previewWidth * 2,
          canvasHeight: previewHeight * 2,
        }),
        imageExportTimeoutMs,
        "image export timeout",
      );
      const image = createImageState(dataUrl);

      setGeneratedImage(image);
      setExportStatus(
        "이미지가 생성되었습니다. 미리보기를 확인한 뒤 다운로드할 수 있습니다.",
      );
      recordGanttDebugEvent(debugEnabled, "export.image.success", {
        byteLength: dataUrl.length,
        fileName: image.fileName,
      });

      return image;
    } catch (error) {
      recordGanttDebugEvent(debugEnabled, "export.image.error", {
        message: error instanceof Error ? error.message : String(error),
      });

      try {
        const dataUrl = createCanvasFallbackImage({
          chartType: state.chartType,
          previewTasks,
          timelineEnd: state.timelineEnd,
          timelineStart: state.timelineStart,
          viewMode: state.viewMode,
        });
        const image = createImageState(dataUrl);

        setGeneratedImage(image);
        setExportStatus(
          "미리보기 DOM 이미지 생성이 지연되어 문서용 이미지로 생성했습니다.",
        );
        recordGanttDebugEvent(debugEnabled, "export.image.fallback_success", {
          byteLength: dataUrl.length,
          fileName: image.fileName,
          reason: error instanceof Error ? error.message : String(error),
        });

        return image;
      } catch (fallbackError) {
        setExportStatus(
          "이미지 생성에 실패했습니다. preview를 다시 확인하세요.",
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

  async function handleCreateImage() {
    await createPreviewImage();
  }

  async function handleDownloadImage() {
    const image = generatedImage ?? (await createPreviewImage());

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
            boundary="start"
            quarterOptions={quarterOptions}
            value={task.start}
            viewMode={state.viewMode}
            onChange={(value) => handleTaskDateChange(task.id, "start", value)}
          />
        </label>
        <label>
          <span>End</span>
          <DateUnitInput
            ariaLabel={`${task.name} 종료`}
            boundary="end"
            quarterOptions={quarterOptions}
            value={task.end}
            viewMode={state.viewMode}
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
            boundary="start"
            quarterOptions={quarterOptions}
            value={task.date || task.start}
            viewMode="Day"
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
              boundary="start"
              quarterOptions={quarterOptions}
              value={task.date || task.start}
              viewMode={state.viewMode}
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
                boundary="start"
                quarterOptions={quarterOptions}
                value={task.start}
                viewMode={state.viewMode}
                onChange={(value) =>
                  handleTaskDateChange(task.id, "start", value)
                }
              />
            </label>
            <label>
              <span>End</span>
              <DateUnitInput
                ariaLabel={`${task.name} 종료`}
                boundary="end"
                quarterOptions={quarterOptions}
                value={task.end}
                viewMode={state.viewMode}
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
        <button type="button" onClick={() => chartRef.current?.scrollToToday()}>
          오늘로 이동
        </button>
        <button type="button" disabled={!canExport} onClick={handleCreateImage}>
          이미지 만들기
        </button>
        <button
          type="button"
          disabled={!canExport}
          onClick={handleDownloadImage}
        >
          이미지 다운로드
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
            <DateUnitInput
              ariaLabel="표시 시작"
              boundary="start"
              quarterOptions={quarterOptions}
              value={state.timelineStart}
              viewMode={state.viewMode}
              onChange={(value) =>
                handleTimelineRangeChange("timelineStart", value)
              }
            />
          </label>
          <label>
            <span>표시 종료</span>
            <DateUnitInput
              ariaLabel="표시 종료"
              boundary="end"
              quarterOptions={quarterOptions}
              value={state.timelineEnd}
              viewMode={state.viewMode}
              onChange={(value) =>
                handleTimelineRangeChange("timelineEnd", value)
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
              ref={chartRef}
              tasks={previewTasks}
              timelineEnd={state.timelineEnd}
              timelineStart={state.timelineStart}
              viewMode={state.viewMode}
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
          {generatedImage ? (
            <section
              className="image-output-panel"
              aria-label="이미지 출력 결과"
            >
              <div className="image-output-copy">
                <h3>이미지 출력</h3>
                <p>
                  현재 preview를 PNG 이미지로 생성했습니다. 생성된 이미지를
                  확인한 뒤 파일로 내려받을 수 있습니다.
                </p>
                <small>
                  {generatedImage.fileName} / {generatedImage.taskCount}개 항목
                  / {generatedImage.chartType}
                </small>
              </div>
              <div className="image-output-frame">
                {/* eslint-disable-next-line @next/next/no-img-element -- Data URL preview is generated locally after export. */}
                <img
                  alt="간트 차트 이미지 출력 미리보기"
                  src={generatedImage.dataUrl}
                />
              </div>
              <button type="button" onClick={handleDownloadImage}>
                생성 이미지 다운로드
              </button>
            </section>
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
