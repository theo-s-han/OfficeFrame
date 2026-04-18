import { describe, expect, it } from "vitest";
import {
  createMilestoneMermaidTimeline,
  createWbsJsGanttRows,
  createWbsMermaidMindmap,
  createWbsMermaidTreeView,
} from "./rendererAdapters";
import type { GanttTask } from "./taskModel";

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
    expect(milestone.title).toBe("마일스톤 흐름");
    expect(milestone.definition).toContain("timeline");
    expect(milestone.definition).toContain("section 기획");
    expect(milestone.definition).toContain("section 설계");
    expect(milestone.definition).toContain("2026-04-20 : [완료] 프로젝트 킥오프 · PM");
    expect(milestone.definition).toContain(
      "2026-05-19 : [계획] UI 시안 확정 · Designer",
    );
    expect(milestone.definition.indexOf("2026-04-20")).toBeLessThan(
      milestone.definition.indexOf("2026-05-19"),
    );
  });

  it("maps WBS groups, tasks, milestones, and additional headers to jsGantt", () => {
    const tasks: GanttTask[] = [
      {
        id: "group",
        code: "1",
        name: "기획",
        parentId: "",
        nodeType: "group",
        start: "",
        end: "",
        progress: 0,
        open: false,
      },
      {
        id: "task",
        code: "1.1",
        name: "시나리오",
        parentId: "group",
        nodeType: "task",
        start: "2026-04-20",
        end: "2026-04-24",
        progress: 40,
        stage: "Discovery",
        owner: "PM",
      },
      {
        id: "mile",
        code: "1.2",
        name: "승인",
        parentId: "group",
        nodeType: "milestone",
        date: "2026-04-25",
        start: "2026-04-25",
        end: "2026-04-25",
        progress: 100,
        dependsOn: ["task"],
      },
    ];

    const result = createWbsJsGanttRows(tasks);

    expect(result.additionalHeaders).toHaveProperty("code");
    expect(result.rows[0]).toMatchObject({
      pGroup: 1,
      pParent: 0,
      pOpen: 0,
      pStart: "",
      pEnd: "",
      pClass: "gantt-group-bar",
    });
    expect(result.rows[1]).toMatchObject({
      pParent: 1,
      pGroup: 0,
      pMile: 0,
      pClass: expect.stringMatching(/^gantt-task-color-/),
      code: "1.1",
      stage: "Discovery",
      owner: "PM",
      pDataObject: {
        code: "1.1",
        stage: "Discovery",
        owner: "PM",
      },
    });
    expect(result.rows[2]).toMatchObject({
      pParent: 1,
      pMile: 1,
      pStart: "2026-04-25",
      pEnd: "2026-04-25",
      pClass: "gantt-milestone-bar",
      pDepend: "2",
    });
  });

  it("creates Mermaid definitions for WBS document previews", () => {
    const wbsTasks: GanttTask[] = [
      {
        id: "group",
        code: "1",
        name: "기획",
        parentId: "",
        nodeType: "group",
        start: "",
        end: "",
        progress: 0,
      },
      {
        id: "task",
        code: "1.1",
        name: "시나리오",
        parentId: "group",
        nodeType: "task",
        start: "2026-04-20",
        end: "2026-04-24",
        progress: 40,
      },
    ];

    expect(createWbsMermaidTreeView(wbsTasks).definition).toContain(
      "treeView-beta",
    );
    expect(createWbsMermaidMindmap(wbsTasks).definition).toContain("mindmap");
  });
});
