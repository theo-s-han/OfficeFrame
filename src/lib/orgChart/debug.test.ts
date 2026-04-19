import {
  readOrgChartDebugEnabledFromSources,
  recordOrgChartDebugEvent,
} from "./debug";

describe("org chart debug", () => {
  it("enables debug mode from the org chart query or shared debug flag", () => {
    expect(readOrgChartDebugEnabledFromSources("?debug=orgchart", null)).toBe(true);
    expect(readOrgChartDebugEnabledFromSources("?debug=all", null)).toBe(true);
    expect(readOrgChartDebugEnabledFromSources("", "true")).toBe(true);
    expect(readOrgChartDebugEnabledFromSources("", null)).toBe(false);
  });

  it("skips recording when debug mode is disabled", () => {
    window.__OFFICE_TOOL_ORGCHART_DEBUG__ = [];
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    expect(recordOrgChartDebugEvent("orgchart.init", {}, false)).toBeNull();
    expect(window.__OFFICE_TOOL_ORGCHART_DEBUG__).toEqual([]);
    expect(infoSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
  });
});
