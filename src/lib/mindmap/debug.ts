import {
  readToolDebugEnabled,
  readToolDebugEnabledFromSources,
  recordToolDebugEvent,
} from "@/lib/shared/debug";

const debugStorageKey = "officeTool.mindmap.debug";
const mindmapDebugQuery = {
  debugKeys: ["mindmap"],
} as const;
const mindmapDebugWindowKey = "__OFFICE_TOOL_MINDMAP_DEBUG__";

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
  return readToolDebugEnabledFromSources(search, storedValue, mindmapDebugQuery);
}

export function readMindmapDebugEnabled(): boolean {
  return readToolDebugEnabled(debugStorageKey, mindmapDebugQuery);
}

export function recordMindmapDebugEvent(
  event: string,
  payload: unknown,
  enabled: boolean,
): MindmapDebugEntry | null {
  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  } satisfies MindmapDebugEntry;

  return recordToolDebugEvent({
    enabled,
    entry,
    windowKey: mindmapDebugWindowKey,
    consoleTag: "[office-tool][mindmap]",
  });
}
