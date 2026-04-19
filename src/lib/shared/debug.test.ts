import {
  readToolDebugEnabledFromSources,
  recordToolDebugEvent,
} from "./debug";

describe("shared debug", () => {
  it("supports query aliases and optional debug=all handling", () => {
    expect(
      readToolDebugEnabledFromSources("?debug=timeline", null, {
        debugKeys: ["timeline"],
      }),
    ).toBe(true);

    expect(
      readToolDebugEnabledFromSources("?debug=all", null, {
        debugKeys: ["gantt"],
        acceptAll: false,
      }),
    ).toBe(false);

    expect(
      readToolDebugEnabledFromSources("?debug=all", null, {
        debugKeys: ["mindmap"],
      }),
    ).toBe(true);
  });

  it("records entries into the configured window key only when enabled", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const debugWindow = window as Window & {
      __TEST_DEBUG__?: Array<{ event: string; timestamp: string }>;
    };

    debugWindow.__TEST_DEBUG__ = [];

    expect(
      recordToolDebugEvent({
        enabled: false,
        entry: {
          event: "skip",
          timestamp: new Date().toISOString(),
        },
        windowKey: "__TEST_DEBUG__",
        consoleTag: "[test]",
      }),
    ).toBeNull();
    expect(debugWindow.__TEST_DEBUG__).toEqual([]);

    const entry = recordToolDebugEvent({
      enabled: true,
      entry: {
        event: "recorded",
        timestamp: new Date().toISOString(),
      },
      windowKey: "__TEST_DEBUG__",
      consoleTag: "[test]",
    });

    expect(entry?.event).toBe("recorded");
    expect(debugWindow.__TEST_DEBUG__?.at(-1)?.event).toBe("recorded");
    expect(infoSpy).toHaveBeenCalledWith("[test]", expect.objectContaining({ event: "recorded" }));

    infoSpy.mockRestore();
  });
});
