import {
  readToolDebugEnabled,
  readToolDebugEnabledFromSources,
  recordToolDebugEvent,
} from "@/lib/shared/debug";

const debugStorageKey = "officeTool.orgchart.debug";
const orgChartDebugQuery = {
  debugKeys: ["orgchart"],
} as const;
const orgChartDebugWindowKey = "__OFFICE_TOOL_ORGCHART_DEBUG__";

export type OrgChartDebugEntry = {
  event: string;
  payload: unknown;
  timestamp: string;
};

declare global {
  interface Window {
    __OFFICE_TOOL_ORGCHART_DEBUG__?: OrgChartDebugEntry[];
  }
}

export function readOrgChartDebugEnabledFromSources(
  search: string,
  storedValue: string | null,
) {
  return readToolDebugEnabledFromSources(search, storedValue, orgChartDebugQuery);
}

export function readOrgChartDebugEnabled() {
  return readToolDebugEnabled(debugStorageKey, orgChartDebugQuery);
}

export function recordOrgChartDebugEvent(
  event: string,
  payload: unknown,
  enabled: boolean,
) {
  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  } satisfies OrgChartDebugEntry;

  return recordToolDebugEvent({
    enabled,
    entry,
    windowKey: orgChartDebugWindowKey,
    consoleTag: "[office-tool][org-chart]",
  });
}
