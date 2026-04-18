"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type Gantt from "frappe-gantt";
import type {
  FrappeGanttTask,
  FrappeGanttViewMode,
  FrappeGanttViewModeConfig,
} from "frappe-gantt";
import { recordGanttDebugEvent } from "@/lib/gantt/debug";
import {
  getFrappeRangeEnd,
  getMonthHeaderLabel,
  getWeekOfMonthLabel,
  parseDateInput,
} from "@/lib/gantt/dateUnits";
import { resolveGanttTaskVisual } from "@/lib/gantt/taskColorResolver";
import type {
  GanttChartType,
  GanttTask,
  GanttViewMode,
  WbsStructureType,
} from "@/lib/gantt/taskModel";
import { isValidDateObject } from "@/lib/gantt/taskModel";
import { TypedGanttPreview } from "./TypedGanttPreview";

type GanttChartPreviewProps = {
  tasks: GanttTask[];
  chartType: GanttChartType;
  viewMode: GanttViewMode;
  timelineStart: string;
  timelineEnd: string;
  weekColumnWidth: number;
  monthColumnWidth: number;
  selectedTaskId?: string;
  wbsProjectName: string;
  wbsStructureType: WbsStructureType;
  debugEnabled: boolean;
  onDateChange: (taskId: string, start: Date, end: Date) => void;
  onProgressChange: (taskId: string, progress: number) => void;
  onSelectTask: (taskId: string) => void;
};

type FrappeGanttInternal = Gantt & {
  gantt_start: Date;
  gantt_end: Date;
  setup_date_values: () => void;
  render: () => void;
};

function toFrappeTasks(tasks: GanttTask[]): FrappeGanttTask[] {
  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    start: task.start,
    end: task.end,
    progress: task.progress,
    custom_class: task.customClass,
    dependencies: task.dependencies ?? [],
  }));
}

function canRenderSvgGantt(): boolean {
  const svgGraphicsPrototype =
    typeof SVGGraphicsElement !== "undefined"
      ? SVGGraphicsElement.prototype
      : null;

  return (
    typeof window !== "undefined" &&
    svgGraphicsPrototype !== null &&
    typeof svgGraphicsPrototype.getBBox === "function"
  );
}

function applyProjectTaskColors(
  wrapper: HTMLElement,
  tasks: GanttTask[],
  chartType: GanttChartType,
) {
  if (chartType !== "project") {
    return;
  }

  const taskVisuals = new Map(
    tasks.map((task) => [task.id, resolveGanttTaskVisual(task, { chartType })]),
  );

  wrapper
    .querySelectorAll<HTMLElement>(".bar-wrapper")
    .forEach((barWrapper) => {
      const taskId = barWrapper.getAttribute("data-id");
      const visual = taskId ? taskVisuals.get(taskId) : undefined;

      if (!visual) {
        return;
      }

      const bar = barWrapper.querySelector<SVGElement>(".bar");
      const progressBar = barWrapper.querySelector<SVGElement>(".bar-progress");

      barWrapper.dataset.ganttColorSource = visual.colorSource;
      barWrapper.dataset.ganttPaletteIndex = String(visual.paletteIndex);
      barWrapper.style.setProperty("--gantt-task-color", visual.baseColor);
      barWrapper.style.setProperty(
        "--gantt-task-progress",
        visual.progressColor,
      );
      barWrapper.style.setProperty(
        "--gantt-task-remaining",
        visual.remainingColor,
      );
      barWrapper.style.setProperty("--gantt-task-border", visual.borderColor);

      bar?.setAttribute("fill", visual.remainingColor);
      bar?.setAttribute("stroke", visual.baseColor);
      bar?.setAttribute("stroke-width", "0.8");
      bar?.style.setProperty("fill", visual.remainingColor);
      bar?.style.setProperty("stroke", visual.baseColor);
      bar?.style.setProperty("stroke-width", "0.8");
      progressBar?.setAttribute("fill", visual.progressColor);
      progressBar?.style.setProperty("fill", visual.progressColor);
    });
}

function formatQuarter(date: Date): string {
  return `${Math.floor(date.getMonth() / 3) + 1}Q`;
}

export function getDayViewMode(): FrappeGanttViewModeConfig {
  return {
    name: "Day",
    padding: ["0d", "0d"],
    step: "1d",
    date_format: "YYYY-MM-DD",
    lower_text: (date) => String(date.getDate()).padStart(2, "0"),
    upper_text: (date, previousDate) =>
      !previousDate || date.getMonth() !== previousDate.getMonth()
        ? getMonthHeaderLabel(date)
        : "",
    thick_line: (date) => date.getDate() === 1,
    snap_at: "1d",
  };
}

export function getQuarterViewMode(): FrappeGanttViewModeConfig {
  return {
    name: "Quarter",
    padding: ["0d", "0d"],
    step: "3m",
    column_width: 170,
    date_format: "YYYY-MM",
    lower_text: (date) => formatQuarter(date),
    upper_text: (date, previousDate) =>
      !previousDate || date.getFullYear() !== previousDate.getFullYear()
        ? `${date.getFullYear()}`
        : "",
    thick_line: (date) => date.getMonth() === 0,
    snap_at: "30d",
  };
}

export function getWeekViewMode(
  columnWidth: number,
): FrappeGanttViewModeConfig {
  return {
    name: "Week",
    padding: ["0d", "0d"],
    step: "7d",
    column_width: columnWidth,
    date_format: "YYYY-MM-DD",
    lower_text: (date) => getWeekOfMonthLabel(date),
    upper_text: (date, previousDate) =>
      !previousDate || date.getMonth() !== previousDate.getMonth()
        ? getMonthHeaderLabel(date)
        : "",
    thick_line: (date) => date.getDate() <= 7,
    upper_text_frequency: 4,
    snap_at: "7d",
  };
}

export function getMonthViewMode(
  columnWidth: number,
): FrappeGanttViewModeConfig {
  return {
    name: "Month",
    padding: ["0m", "0m"],
    step: "1m",
    column_width: columnWidth,
    date_format: "YYYY-MM",
    lower_text: (date) => getMonthHeaderLabel(date),
    upper_text: (date, previousDate) =>
      !previousDate || date.getFullYear() !== previousDate.getFullYear()
        ? `${date.getFullYear()}`
        : "",
    thick_line: (date) => date.getMonth() === 0,
    snap_at: "7d",
  };
}

function getFrappeViewModes(
  selectedViewMode: GanttViewMode,
  weekColumnWidth: number,
  monthColumnWidth: number,
): Array<FrappeGanttViewMode | FrappeGanttViewModeConfig> {
  const dayViewMode = getDayViewMode();
  const weekViewMode = getWeekViewMode(weekColumnWidth);
  const monthViewMode = getMonthViewMode(monthColumnWidth);
  const quarterViewMode = getQuarterViewMode();
  const viewModes: Array<FrappeGanttViewMode | FrappeGanttViewModeConfig> = [
    dayViewMode,
    weekViewMode,
    monthViewMode,
    quarterViewMode,
  ];
  const selected =
    selectedViewMode === "Day"
      ? dayViewMode
      : selectedViewMode === "Week"
        ? weekViewMode
        : selectedViewMode === "Month"
          ? monthViewMode
          : selectedViewMode === "Quarter"
            ? quarterViewMode
            : (selectedViewMode as FrappeGanttViewMode);

  return [
    selected,
    ...viewModes.filter((viewMode) =>
      typeof viewMode === "string"
        ? viewMode !== selectedViewMode
        : viewMode.name !== selectedViewMode,
    ),
  ];
}

function applyTimelineRange(
  gantt: Gantt,
  timelineStart: string,
  timelineEnd: string,
  viewMode: GanttViewMode,
) {
  const internalGantt = gantt as FrappeGanttInternal;

  internalGantt.gantt_start = parseDateInput(timelineStart);
  internalGantt.gantt_end = parseDateInput(
    getFrappeRangeEnd(timelineEnd, viewMode),
  );
  internalGantt.setup_date_values();
  internalGantt.render();
}

export function GanttChartPreview({
  tasks,
  chartType,
  viewMode,
  timelineStart,
  timelineEnd,
  weekColumnWidth,
  monthColumnWidth,
  selectedTaskId,
  wbsProjectName,
  wbsStructureType,
  debugEnabled,
  onDateChange,
  onProgressChange,
  onSelectTask,
}: GanttChartPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const dateChangeRef = useRef(onDateChange);
  const progressChangeRef = useRef(onProgressChange);
  const selectTaskRef = useRef(onSelectTask);
  const [status, setStatus] = useState("간트 preview를 준비하고 있습니다.");
  const frappeTasks = useMemo(() => toFrappeTasks(tasks), [tasks]);
  const taskSelectionIds = useMemo(
    () =>
      new Map(tasks.map((task) => [task.id, task.previewSourceId ?? task.id])),
    [tasks],
  );
  const taskDateTargets = useMemo(
    () =>
      new Map(
        tasks.map((task) => [task.id, task.previewDateTarget ?? "actual"]),
      ),
    [tasks],
  );
  const projectColumnWidth =
    viewMode === "Week"
      ? weekColumnWidth
      : viewMode === "Month"
        ? monthColumnWidth
        : undefined;

  useEffect(() => {
    dateChangeRef.current = onDateChange;
    progressChangeRef.current = onProgressChange;
    selectTaskRef.current = onSelectTask;
  }, [onDateChange, onProgressChange, onSelectTask]);

  useEffect(() => {
    let isMounted = true;
    let clickTarget: HTMLDivElement | null = null;
    let clickHandler: ((event: Event) => void) | null = null;
    let lastSelectedTaskId = "";
    let lastSelectedAt = 0;

    function selectTaskForEdit(taskId: string) {
      const now = window.performance.now();
      const sourceTaskId = taskSelectionIds.get(taskId) ?? taskId;

      if (lastSelectedTaskId === sourceTaskId && now - lastSelectedAt < 150) {
        return;
      }

      lastSelectedTaskId = sourceTaskId;
      lastSelectedAt = now;
      selectTaskRef.current(sourceTaskId);
    }

    async function renderGantt() {
      if (!wrapperRef.current) {
        return;
      }

      if (chartType !== "project") {
        wrapperRef.current.innerHTML = "";
        ganttRef.current = null;
        setStatus("");
        return;
      }

      if (frappeTasks.length === 0) {
        wrapperRef.current.innerHTML = "";
        ganttRef.current = null;
        setStatus("작업을 추가하면 간트 preview가 표시됩니다.");
        return;
      }

      if (!canRenderSvgGantt()) {
        setStatus("브라우저에서 간트 preview를 불러옵니다.");
        return;
      }

      try {
        const { default: FrappeGantt } = await import("frappe-gantt");

        if (!isMounted || !wrapperRef.current) {
          return;
        }

        wrapperRef.current.innerHTML = "";
        clickTarget = wrapperRef.current;
        clickHandler = (event: Event) => {
          const target = event.target instanceof Element ? event.target : null;
          const taskWrapper = target?.closest(".bar-wrapper");
          const taskId = taskWrapper?.getAttribute("data-id");

          if (!taskId) {
            return;
          }

          selectTaskForEdit(taskId);
          recordGanttDebugEvent(debugEnabled, "chart.click_for_edit", {
            taskId,
          });
        };
        clickTarget.addEventListener("pointerup", clickHandler, true);
        clickTarget.addEventListener("click", clickHandler, true);

        const ganttOptions = {
          view_mode: viewMode,
          view_modes: getFrappeViewModes(
            viewMode,
            weekColumnWidth,
            monthColumnWidth,
          ),
          column_width: projectColumnWidth,
          date_format: "YYYY-MM-DD",
          holidays: {},
          infinite_padding: false,
          language: "ko",
          lines: "both",
          move_dependencies: false,
          popup_on: "click",
          readonly_progress: false,
          scroll_to: "start",
          show_expected_progress: false,
          today_button: false,
          view_mode_select: false,
          on_click: (task) => {
            selectTaskForEdit(task.id);
            recordGanttDebugEvent(debugEnabled, "chart.click", {
              taskId: task.id,
            });
          },
          on_date_change: (task, start, end) => {
            const sourceTaskId = taskSelectionIds.get(task.id) ?? task.id;

            if (taskDateTargets.get(task.id) === "readonly") {
              selectTaskForEdit(task.id);
              recordGanttDebugEvent(
                debugEnabled,
                "chart.date_change.reverted",
                {
                  taskId: task.id,
                  sourceTaskId,
                  reason: "readonly_preview_task",
                },
              );
              return;
            }

            dateChangeRef.current(sourceTaskId, start, end);
            recordGanttDebugEvent(debugEnabled, "chart.date_change.event", {
              taskId: task.id,
              sourceTaskId,
              start: isValidDateObject(start)
                ? start.toISOString()
                : String(start),
              end: isValidDateObject(end) ? end.toISOString() : String(end),
            });
          },
          on_progress_change: (task, progress) => {
            const sourceTaskId = taskSelectionIds.get(task.id) ?? task.id;

            if (taskDateTargets.get(task.id) === "readonly") {
              selectTaskForEdit(task.id);
              recordGanttDebugEvent(
                debugEnabled,
                "chart.progress_change.reverted",
                {
                  taskId: task.id,
                  sourceTaskId,
                  reason: "readonly_preview_task",
                },
              );
              return;
            }

            progressChangeRef.current(sourceTaskId, progress);
            recordGanttDebugEvent(debugEnabled, "chart.progress_change.event", {
              taskId: task.id,
              sourceTaskId,
              progress,
            });
          },
          popup: ({ task }) =>
            `<strong>${task.name}</strong><br />${task.start} - ${task.end}<br />${task.progress ?? 0}%`,
        } as ConstructorParameters<typeof FrappeGantt>[2];
        const gantt = new FrappeGantt(
          wrapperRef.current,
          frappeTasks,
          ganttOptions,
        );
        ganttRef.current = gantt;
        applyTimelineRange(gantt, timelineStart, timelineEnd, viewMode);
        applyProjectTaskColors(wrapperRef.current, tasks, chartType);
        setStatus("");
        recordGanttDebugEvent(debugEnabled, "chart.render", {
          chartType,
          taskCount: frappeTasks.length,
          projectColumnWidth,
          timelineEnd,
          timelineStart,
          viewMode,
        });
      } catch (error) {
        setStatus("간트 preview를 불러오지 못했습니다.");
        recordGanttDebugEvent(debugEnabled, "chart.render_error", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    void renderGantt();

    return () => {
      isMounted = false;
      if (clickTarget && clickHandler) {
        clickTarget.removeEventListener("pointerup", clickHandler, true);
        clickTarget.removeEventListener("click", clickHandler, true);
      }
    };
  }, [
    debugEnabled,
    frappeTasks,
    chartType,
    tasks,
    timelineEnd,
    timelineStart,
    taskDateTargets,
    taskSelectionIds,
    viewMode,
    projectColumnWidth,
    weekColumnWidth,
    monthColumnWidth,
  ]);

  if (chartType !== "project") {
    return (
      <TypedGanttPreview
        chartType={chartType}
        debugEnabled={debugEnabled}
        onSelectTask={onSelectTask}
        selectedTaskId={selectedTaskId}
        tasks={tasks}
        wbsProjectName={wbsProjectName}
        wbsStructureType={wbsStructureType}
      />
    );
  }

  return (
    <div className="gantt-preview" aria-label="간트 차트 preview">
      <div
        className={`gantt-preview-canvas view-${viewMode.toLowerCase()}`}
        ref={wrapperRef}
      />
      {status ? <p className="gantt-preview-status">{status}</p> : null}
    </div>
  );
}
