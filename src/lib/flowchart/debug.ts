import {
  readToolDebugEnabled,
  readToolDebugEnabledFromSources,
  recordToolDebugEvent,
} from "@/lib/shared/debug";

const debugStorageKey = "officeTool.flowchart.debug";
const flowchartDebugQuery = {
  debugKeys: ["flowchart"],
} as const;
const flowchartDebugWindowKey = "__OFFICE_TOOL_FLOWCHART_DEBUG__";

export type FlowchartDebugEntry = {
  event: string;
  payload: unknown;
  timestamp: string;
};

declare global {
  interface Window {
    __OFFICE_TOOL_FLOWCHART_DEBUG__?: FlowchartDebugEntry[];
  }
}

export function readFlowchartDebugEnabledFromSources(
  search: string,
  storedValue: string | null,
) {
  return readToolDebugEnabledFromSources(search, storedValue, flowchartDebugQuery);
}

export function readFlowchartDebugEnabled() {
  return readToolDebugEnabled(debugStorageKey, flowchartDebugQuery);
}

export function recordFlowchartDebugEvent(
  event: string,
  payload: unknown,
  enabled: boolean,
) {
  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  } satisfies FlowchartDebugEntry;

  return recordToolDebugEvent({
    enabled,
    entry,
    windowKey: flowchartDebugWindowKey,
    consoleTag: "[office-tool][flowchart]",
  });
}
