import { describe, expect, it } from "vitest";
import type { GanttTask } from "./taskModel";
import {
  buildWbsPreviewData,
  buildWbsTreeNodes,
  collectWbsDescendantIds,
  defaultWbsProjectName,
  defaultWbsStructureType,
  getWbsParentOptions,
} from "./wbsTree";

const tasks: GanttTask[] = [
  {
    id: "plan",
    name: "요구 분석",
    parentId: "",
    start: "",
    end: "",
    progress: 0,
    owner: "PM",
    status: "in-progress",
    notes: "상위 구조와 입력 흐름을 먼저 정리합니다.",
  },
  {
    id: "doc",
    name: "요구사항 문서 초안",
    parentId: "plan",
    start: "",
    end: "",
    progress: 0,
    owner: "PM",
    status: "done",
    notes: "문서용 설명 문구까지 함께 작성합니다.",
  },
  {
    id: "build",
    name: "구현 준비",
    parentId: "",
    start: "",
    end: "",
    progress: 0,
    owner: "Dev Lead",
    status: "not-started",
    notes: "미리보기와 이미지 내보내기 품질 기준을 정리합니다.",
  },
];

describe("wbsTree helpers", () => {
  it("builds deterministic WBS codes from parent-child order", () => {
    const nodes = buildWbsTreeNodes(tasks, defaultWbsStructureType);

    expect(nodes[0]).toMatchObject({
      id: "plan",
      code: "1",
      kind: "deliverable",
    });
    expect(nodes[0].children[0]).toMatchObject({
      id: "doc",
      code: "1.1",
      kind: "work-package",
    });
    expect(nodes[1]).toMatchObject({
      id: "build",
      code: "2",
    });
  });

  it("keeps preview text intact without truncating long owner or notes content", () => {
    const nodes = buildWbsTreeNodes(tasks, defaultWbsStructureType);

    expect(nodes[1]?.owner).toBe("Dev Lead");
    expect(nodes[1]?.notes).toContain("이미지 내보내기");
    expect(nodes[1]?.notes?.includes("…")).toBe(false);
  });

  it("converts WBS nodes into preview data with project root metadata", () => {
    const previewData = buildWbsPreviewData(
      tasks,
      defaultWbsProjectName,
      defaultWbsStructureType,
    );

    expect(previewData.name).toBe(defaultWbsProjectName);
    expect(previewData.attributes).toMatchObject({
      code: "WBS",
      kind: "project",
      kindLabel: "산출물형",
    });
    expect(previewData.children?.[0].attributes).toMatchObject({
      code: "1",
      kindLabel: "산출물",
      owner: "PM",
      statusLabel: "진행 중",
    });
  });

  it("filters descendant nodes from parent selection options", () => {
    const descendants = collectWbsDescendantIds(tasks, "plan");
    const parentOptions = getWbsParentOptions(tasks, "plan");

    expect(descendants).toEqual(new Set(["doc"]));
    expect(parentOptions.map((option) => option.value)).toEqual(["build"]);
    expect(parentOptions[0]?.label).toBe("2 구현 준비");
  });
});
