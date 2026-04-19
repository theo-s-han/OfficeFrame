const debugStorageKey = "officeTool.orgchart.debug";

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
  return (
    search.includes("debug=orgchart") ||
    search.includes("debug=all") ||
    storedValue === "true"
  );
}

export function readOrgChartDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return readOrgChartDebugEnabledFromSources(
    window.location.search,
    window.localStorage.getItem(debugStorageKey),
  );
}

export function recordOrgChartDebugEvent(
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
  } satisfies OrgChartDebugEntry;

  window.__OFFICE_TOOL_ORGCHART_DEBUG__ = [
    ...(window.__OFFICE_TOOL_ORGCHART_DEBUG__ ?? []),
    entry,
  ];
  console.info("[office-tool][org-chart]", entry);

  return entry;
}
