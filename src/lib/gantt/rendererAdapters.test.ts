import { describe, expect, it } from "vitest";
import { createMilestoneMermaidTimeline } from "./rendererAdapters";

describe("gantt renderer adapters", () => {
  it("creates a single Mermaid timeline definition for milestone previews", () => {
    const milestone = createMilestoneMermaidTimeline([
      {
        id: "ms-2",
        name: "UI 시안 확정",
        date: "2026-05-19",
        start: "2026-05-19",
        end: "2026-05-19",
        progress: 100,
        section: "설계",
        status: "planned",
        owner: "Designer",
      },
      {
        id: "ms-1",
        name: "프로젝트 킥오프",
        date: "2026-04-20",
        start: "2026-04-20",
        end: "2026-04-20",
        progress: 100,
        section: "기획",
        status: "done",
        owner: "PM",
      },
    ]);

    expect(milestone.kind).toBe("timeline");
    expect(milestone.definition).toContain("timeline");
    expect(milestone.definition).toContain("section 기획");
    expect(milestone.definition).toContain("section 설계");
    expect(milestone.definition.indexOf("2026-04-20")).toBeLessThan(
      milestone.definition.indexOf("2026-05-19"),
    );
  });
});

