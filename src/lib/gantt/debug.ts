import type { GanttDebugSnapshot } from "./taskModel";

export type GanttDebugEvent = {
  label: string;
  timestamp: string;
  payload?: unknown;
};

declare global {
  interface Window {
    __OFFICE_TOOL_GANTT_DEBUG__?: GanttDebugEvent[];
  }
}

export function isGanttDebugRequested(
  search: string,
  storageValue?: string | null,
): boolean {
  const params = new URLSearchParams(search);
  const queryValue = params.get("debug");

  return queryValue === "gantt" || storageValue === "true";
}

export function readGanttDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isGanttDebugRequested(
    window.location.search,
    window.localStorage.getItem("officeTool.gantt.debug"),
  );
}

export function recordGanttDebugEvent(
  enabled: boolean,
  label: string,
  payload?: unknown,
): GanttDebugEvent | null {
  if (!enabled) {
    return null;
  }

  const event: GanttDebugEvent = {
    label,
    timestamp: new Date().toISOString(),
    payload,
  };

  if (typeof window !== "undefined") {
    window.__OFFICE_TOOL_GANTT_DEBUG__ = [
      ...(window.__OFFICE_TOOL_GANTT_DEBUG__ ?? []),
      event,
    ];
  }

  if (typeof console !== "undefined") {
    console.debug("[office-tool:gantt]", label, payload ?? "");
  }

  return event;
}

export function createGanttDebugPayload(snapshot: GanttDebugSnapshot): {
  taskCount: number;
  validTaskCount: number;
  issueCount: number;
  chartType: string;
  viewMode: string;
  timelineStart: string;
  timelineEnd: string;
  backgroundTemplate: string;
  weekColumnWidth: number;
  monthColumnWidth: number;
  selectedTaskId?: string;
} {
  return {
    taskCount: snapshot.taskCount,
    validTaskCount: snapshot.validTaskCount,
    issueCount: snapshot.issueCount,
    chartType: snapshot.chartType,
    viewMode: snapshot.viewMode,
    timelineStart: snapshot.timelineStart,
    timelineEnd: snapshot.timelineEnd,
    backgroundTemplate: snapshot.backgroundTemplate,
    weekColumnWidth: snapshot.weekColumnWidth,
    monthColumnWidth: snapshot.monthColumnWidth,
    selectedTaskId: snapshot.selectedTaskId,
  };
}
