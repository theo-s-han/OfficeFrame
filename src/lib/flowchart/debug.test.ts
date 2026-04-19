import {
  readFlowchartDebugEnabledFromSources,
  recordFlowchartDebugEvent,
} from "./debug";

describe("flowchart debug", () => {
  it("enables debug mode from the flowchart query or shared debug flag", () => {
    expect(readFlowchartDebugEnabledFromSources("?debug=flowchart", null)).toBe(true);
    expect(readFlowchartDebugEnabledFromSources("?debug=all", null)).toBe(true);
    expect(readFlowchartDebugEnabledFromSources("", "true")).toBe(true);
    expect(readFlowchartDebugEnabledFromSources("", null)).toBe(false);
  });

  it("skips recording when debug mode is disabled", () => {
    window.__OFFICE_TOOL_FLOWCHART_DEBUG__ = [];
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    expect(recordFlowchartDebugEvent("flowchart.init", {}, false)).toBeNull();
    expect(window.__OFFICE_TOOL_FLOWCHART_DEBUG__).toEqual([]);
    expect(infoSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
  });
});
