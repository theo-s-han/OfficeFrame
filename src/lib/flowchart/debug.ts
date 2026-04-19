const debugStorageKey = "officeTool.flowchart.debug";

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
  return (
    search.includes("debug=flowchart") ||
    search.includes("debug=all") ||
    storedValue === "true"
  );
}

export function readFlowchartDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return readFlowchartDebugEnabledFromSources(
    window.location.search,
    window.localStorage.getItem(debugStorageKey),
  );
}

export function recordFlowchartDebugEvent(
  event: string,
  payload: unknown,
  enabled: boolean,
) {
  if (!enabled || typeof window === "undefined") {
    return null;
  }

  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  } satisfies FlowchartDebugEntry;

  window.__OFFICE_TOOL_FLOWCHART_DEBUG__ = [
    ...(window.__OFFICE_TOOL_FLOWCHART_DEBUG__ ?? []),
    entry,
  ];
  console.info("[office-tool][flowchart]", entry);

  return entry;
}
