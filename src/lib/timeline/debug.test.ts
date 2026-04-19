import {
  readTimelineDebugEnabledFromSources,
  recordTimelineDebugEvent,
} from "./debug";

describe("timeline debug", () => {
  it("enables debug mode only for explicit timeline sources", () => {
    expect(readTimelineDebugEnabledFromSources("?debug=timeline", null)).toBe(true);
    expect(readTimelineDebugEnabledFromSources("?debug=all", null)).toBe(true);
    expect(readTimelineDebugEnabledFromSources("", "true")).toBe(true);
    expect(readTimelineDebugEnabledFromSources("", null)).toBe(false);
  });

  it("does not record timeline debug entries when debug is disabled", () => {
    window.__OFFICE_TOOL_TIMELINE_DEBUG__ = [];
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    expect(
      recordTimelineDebugEvent("timeline.export.initial", { example: true }, false),
    ).toBeNull();
    expect(window.__OFFICE_TOOL_TIMELINE_DEBUG__).toEqual([]);
    expect(infoSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
  });
});
