const debugStorageKey = "officeTool.timeline.debug";

export type TimelineDebugEntry = {
  event: string;
  payload: unknown;
  timestamp: string;
};

declare global {
  interface Window {
    __OFFICE_TOOL_TIMELINE_DEBUG__?: TimelineDebugEntry[];
  }
}

export function readTimelineDebugEnabledFromSources(
  search: string,
  storedValue: string | null,
) {
  return (
    search.includes("debug=timeline") ||
    search.includes("debug=all") ||
    storedValue === "true"
  );
}

export function readTimelineDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return readTimelineDebugEnabledFromSources(
    window.location.search,
    window.localStorage.getItem(debugStorageKey),
  );
}

export function recordTimelineDebugEvent(
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
  } satisfies TimelineDebugEntry;

  window.__OFFICE_TOOL_TIMELINE_DEBUG__ = [
    ...(window.__OFFICE_TOOL_TIMELINE_DEBUG__ ?? []),
    entry,
  ];
  console.info("[office-tool][timeline]", entry);

  return entry;
}
