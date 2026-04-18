"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
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
import type {
  GanttChartType,
  GanttTask,
  GanttViewMode,
} from "@/lib/gantt/taskModel";
import { isValidDateObject } from "@/lib/gantt/taskModel";

export type GanttChartPreviewHandle = {
  scrollToToday: () => void;
};

type GanttChartPreviewProps = {
  tasks: GanttTask[];
  chartType: GanttChartType;
  viewMode: GanttViewMode;
  timelineStart: string;
  timelineEnd: string;
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

function formatQuarter(date: Date): string {
  return `${Math.floor(date.getMonth() / 3) + 1}Q`;
}

function getQuarterViewMode(): FrappeGanttViewModeConfig {
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
    thick_line: () => true,
    snap_at: "30d",
  };
}

function getWeekViewMode(): FrappeGanttViewModeConfig {
  return {
    name: "Week",
    padding: ["0d", "0d"],
    step: "7d",
    column_width: 96,
    date_format: "YYYY-MM-DD",
    lower_text: (date) => getWeekOfMonthLabel(date),
    upper_text: (date, previousDate) =>
      !previousDate || date.getMonth() !== previousDate.getMonth()
        ? getMonthHeaderLabel(date)
        : "",
    thick_line: (date) => date.getDate() >= 1 && date.getDate() <= 7,
    upper_text_frequency: 4,
    snap_at: "7d",
  };
}

function getFrappeViewModes(
  selectedViewMode: GanttViewMode,
): Array<FrappeGanttViewMode | FrappeGanttViewModeConfig> {
  const weekViewMode = getWeekViewMode();
  const quarterViewMode = getQuarterViewMode();
  const viewModes: Array<FrappeGanttViewMode | FrappeGanttViewModeConfig> = [
    "Day",
    weekViewMode,
    "Month",
    quarterViewMode,
  ];
  const selected =
    selectedViewMode === "Week"
      ? weekViewMode
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

export const GanttChartPreview = forwardRef<
  GanttChartPreviewHandle,
  GanttChartPreviewProps
>(function GanttChartPreview(
  {
    tasks,
    chartType,
    viewMode,
    timelineStart,
    timelineEnd,
    debugEnabled,
    onDateChange,
    onProgressChange,
    onSelectTask,
  },
  ref,
) {
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

  useEffect(() => {
    dateChangeRef.current = onDateChange;
    progressChangeRef.current = onProgressChange;
    selectTaskRef.current = onSelectTask;
  }, [onDateChange, onProgressChange, onSelectTask]);

  useImperativeHandle(ref, () => ({
    scrollToToday() {
      ganttRef.current?.scroll_current();
      recordGanttDebugEvent(debugEnabled, "chart.scroll_today", {
        taskCount: tasks.length,
      });
    },
  }));

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

        const gantt = new FrappeGantt(wrapperRef.current, frappeTasks, {
          view_mode: viewMode,
          view_modes: getFrappeViewModes(viewMode),
          date_format: "YYYY-MM-DD",
          infinite_padding: false,
          language: "ko",
          lines: "both",
          move_dependencies: false,
          popup_on: "click",
          readonly_progress:
            chartType === "roadmap" || chartType === "milestones",
          scroll_to: "start",
          show_expected_progress: chartType === "progress",
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
        });
        ganttRef.current = gantt;
        applyTimelineRange(gantt, timelineStart, timelineEnd, viewMode);
        setStatus("");
        recordGanttDebugEvent(debugEnabled, "chart.render", {
          chartType,
          taskCount: frappeTasks.length,
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
    timelineEnd,
    timelineStart,
    taskDateTargets,
    taskSelectionIds,
    viewMode,
  ]);

  return (
    <div className="gantt-preview" aria-label="간트 차트 preview">
      <div className="gantt-preview-canvas" ref={wrapperRef} />
      {status ? <p className="gantt-preview-status">{status}</p> : null}
    </div>
  );
});
