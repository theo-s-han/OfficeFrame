const debugStorageKey = "officeTool.mindmap.debug";

export type MindmapDebugEntry = {
  event: string;
  payload: unknown;
  timestamp: string;
};

declare global {
  interface Window {
    __OFFICE_TOOL_MINDMAP_DEBUG__?: MindmapDebugEntry[];
  }
}

export function readMindmapDebugEnabledFromSources(
  search: string,
  storedValue: string | null,
): boolean {
  return (
    search.includes("debug=mindmap") ||
    search.includes("debug=all") ||
    storedValue === "true"
  );
}

export function readMindmapDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return readMindmapDebugEnabledFromSources(
    window.location.search,
    window.localStorage.getItem(debugStorageKey),
  );
}

export function recordMindmapDebugEvent(
  event: string,
  payload: unknown,
  enabled: boolean,
): MindmapDebugEntry | null {
  if (!enabled || typeof window === "undefined") {
    return null;
  }

  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  } satisfies MindmapDebugEntry;

  window.__OFFICE_TOOL_MINDMAP_DEBUG__ = [
    ...(window.__OFFICE_TOOL_MINDMAP_DEBUG__ ?? []),
    entry,
  ];
  console.info("[office-tool][mindmap]", entry);

  return entry;
}
