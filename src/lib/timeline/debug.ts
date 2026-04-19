import {
  readToolDebugEnabled,
  readToolDebugEnabledFromSources,
  recordToolDebugEvent,
} from "@/lib/shared/debug";

const debugStorageKey = "officeTool.timeline.debug";
const timelineDebugQuery = {
  debugKeys: ["timeline"],
} as const;
const timelineDebugWindowKey = "__OFFICE_TOOL_TIMELINE_DEBUG__";

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
  return readToolDebugEnabledFromSources(search, storedValue, timelineDebugQuery);
}

export function readTimelineDebugEnabled() {
  return readToolDebugEnabled(debugStorageKey, timelineDebugQuery);
}

export function recordTimelineDebugEvent(
  event: string,
  payload: unknown,
  enabled: boolean,
) {
  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  } satisfies TimelineDebugEntry;

  return recordToolDebugEvent({
    enabled,
    entry,
    windowKey: timelineDebugWindowKey,
    consoleTag: "[office-tool][timeline]",
  });
}
