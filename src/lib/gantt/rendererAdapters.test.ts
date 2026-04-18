import { describe, expect, it } from "vitest";
import {
  createMilestoneJsGanttRows,
  createMilestoneMermaidGantt,
  createWbsJsGanttRows,
  createWbsMermaidMindmap,
  createWbsMermaidTreeView,
} from "./rendererAdapters";
import type { GanttTask } from "./taskModel";

describe("gantt renderer adapters", () => {
  it("maps milestone DSL to jsGantt milestone rows", () => {
    const tasks: GanttTask[] = [
      {
        id: "ms-1",
        name: "범위 승인",
        date: "2026-04-20",
        start: "2026-04-20",
        end: "2026-04-20",
        progress: 100,
        section: "기획",
        owner: "PM",
        dependsOn: [],
        critical: true,
        status: "done",
      },
      {
        id: "ms-2",
        name: "릴리즈",
        date: "2026-05-01",
        start: "2026-05-01",
        end: "2026-05-01",
        progress: 100,
        dependsOn: ["ms-1"],
        status: "planned",
      },
      {
        id: "ms-3",
        name: "리뷰",
        date: "2026-05-07",
        start: "2026-05-07",
        end: "2026-05-07",
        progress: 100,
        dependsOn: ["ms-1", "ms-2"],
        status: "on-track",
      },
    ];

    const result = createMilestoneJsGanttRows(tasks);

    expect(result.rows[0]).toMatchObject({
      pMile: 1,
      pStart: "2026-04-20",
      pEnd: "2026-04-20",
      pClass: "gantt-milestone-bar",
      pCaption: "done",
      pDepend: "",
      section: "기획",
      status: "done",
      owner: "PM",
      pDataObject: {
        domainId: "ms-1",
        section: "기획",
        owner: "PM",
        status: "done",
      },
    });
    expect(result.rows[1].pDepend).toBe("1");
    expect(result.rows[2]).toMatchObject({
      pID: 3,
      pDepend: "1,2",
      pDataObject: {
        domainId: "ms-3",
      },
    });
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

  it("creates Mermaid definitions for milestone and WBS document previews", () => {
    const milestone = createMilestoneMermaidGantt([
      {
        id: "ms-1",
        name: "범위 승인",
        date: "2026-04-20",
        start: "2026-04-20",
        end: "2026-04-20",
        progress: 100,
        section: "기획",
        critical: true,
      },
    ]);
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

    expect(milestone.definition).toContain("milestone");
    expect(milestone.definition).toContain("vert");
    expect(milestone.definition).toContain("axisFormat %m/%d");
    expect(milestone.definition).toContain("tickInterval 1week");
    expect(milestone.definition).toContain("todayMarker off");
    expect(createWbsMermaidTreeView(wbsTasks).definition).toContain(
      "treeView-beta",
    );
    expect(createWbsMermaidMindmap(wbsTasks).definition).toContain("mindmap");
  });
});
