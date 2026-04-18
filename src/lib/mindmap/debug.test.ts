import { describe, expect, it, vi } from "vitest";
import {
  readMindmapDebugEnabledFromSources,
  recordMindmapDebugEvent,
} from "./debug";

describe("mindmap debug", () => {
  it("enables debug mode from query or storage sources", () => {
    expect(readMindmapDebugEnabledFromSources("?debug=mindmap", null)).toBe(
      true,
    );
    expect(readMindmapDebugEnabledFromSources("", "true")).toBe(true);
    expect(readMindmapDebugEnabledFromSources("", null)).toBe(false);
  });

  it("records debug entries only when enabled", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    expect(recordMindmapDebugEvent("preview.init", {}, false)).toBeNull();

    const entry = recordMindmapDebugEvent("preview.init", { nodeCount: 1 }, true);

    expect(entry?.event).toBe("preview.init");
    expect(window.__OFFICE_TOOL_MINDMAP_DEBUG__?.at(-1)?.event).toBe(
      "preview.init",
    );

    infoSpy.mockRestore();
  });
});
