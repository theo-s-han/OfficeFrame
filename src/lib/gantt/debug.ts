import {
  readToolDebugEnabled,
  readToolDebugEnabledFromSources,
  recordToolDebugEvent,
} from "@/lib/shared/debug";
import type { GanttDebugSnapshot } from "./taskModel";

export type GanttDebugEvent = {
  label: string;
  timestamp: string;
  payload?: unknown;
};

const ganttDebugStorageKey = "officeTool.gantt.debug";
const ganttDebugQuery = {
  acceptAll: false,
  debugKeys: ["gantt"],
} as const;
const ganttDebugWindowKey = "__OFFICE_TOOL_GANTT_DEBUG__";

declare global {
  interface Window {
    __OFFICE_TOOL_GANTT_DEBUG__?: GanttDebugEvent[];
  }
}

export function isGanttDebugRequested(
  search: string,
  storageValue?: string | null,
): boolean {
  return readToolDebugEnabledFromSources(search, storageValue, ganttDebugQuery);
}

export function readGanttDebugEnabled(): boolean {
  return readToolDebugEnabled(ganttDebugStorageKey, ganttDebugQuery);
}

export function recordGanttDebugEvent(
  enabled: boolean,
  label: string,
  payload?: unknown,
): GanttDebugEvent | null {
  const event: GanttDebugEvent = {
    label,
    timestamp: new Date().toISOString(),
    payload,
  };

  return recordToolDebugEvent({
    enabled,
    entry: event,
    windowKey: ganttDebugWindowKey,
    consoleTag: "[office-tool:gantt]",
    consoleMethod: "debug",
    consoleArgs: (entry) => ["[office-tool:gantt]", entry.label, entry.payload ?? ""],
  });
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
