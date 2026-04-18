import type { MindElixirData, NodeObjExport } from "mind-elixir";
import {
  defaultGanttTaskColor,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";
import { defaultGanttPalette } from "@/lib/gantt/theme";
import {
  defaultMindmapTheme,
  getMindmapNodePresentation,
  getMindmapPaletteColor,
} from "./theme";

export type MindmapNode = {
  children: MindmapNode[];
  color: string;
  expanded: boolean;
  id: string;
  note: string;
  topic: string;
};

export type FlattenedMindmapNode = {
  childCount: number;
  color: string;
  depth: number;
  expanded: boolean;
  id: string;
  note: string;
  parentId: string | null;
  topic: string;
};

export type MindmapValidationIssue = {
  field: "color" | "topic";
  message: string;
  nodeId: string;
};

type MindmapNodeInit = Partial<
  Omit<MindmapNode, "children" | "color" | "expanded" | "note" | "topic">
> & {
  children?: MindmapNode[];
  color?: string;
  expanded?: boolean;
  note?: string;
  topic?: string;
};

const defaultNewMindmapTopic = "새 노드";

export function createMindmapNode(init: MindmapNodeInit): MindmapNode {
  return {
    id: init.id ?? "node-1",
    topic: init.topic ?? defaultNewMindmapTopic,
    note: init.note ?? "",
    color: normalizeGanttTaskColor(init.color ?? defaultGanttTaskColor),
    expanded: init.expanded ?? true,
    children: init.children?.map(cloneMindmapNode) ?? [],
  };
}

export function cloneMindmapNode(node: MindmapNode): MindmapNode {
  return {
    ...node,
    children: node.children.map(cloneMindmapNode),
  };
}

export function createEmptyMindmap(): MindmapNode {
  return createMindmapNode({
    id: "mind-root",
    topic: "새 마인드맵",
    note: "문서에 붙여넣기 좋은 구조를 만들어 보세요.",
    color: defaultGanttPalette.taskColors[0],
    children: [],
  });
}

export function createSampleMindmap(): MindmapNode {
  return createMindmapNode({
    id: "mind-root",
    topic: "문서형 업무 도구",
    note: "문서와 보고서에 붙여넣는 구조형 결과물",
    color: defaultGanttPalette.taskColors[0],
    children: [
      createMindmapNode({
        id: "mind-goal",
        topic: "목표 정리",
        color: getMindmapPaletteColor(0),
        children: [
          createMindmapNode({
            id: "mind-goal-doc",
            topic: "문서형 결과물",
            color: getMindmapPaletteColor(0),
          }),
          createMindmapNode({
            id: "mind-goal-b2b",
            topic: "실무자 중심 UX",
            color: getMindmapPaletteColor(0),
          }),
          createMindmapNode({
            id: "mind-goal-speed",
            topic: "학습 부담 최소화",
            color: getMindmapPaletteColor(0),
          }),
        ],
      }),
      createMindmapNode({
        id: "mind-input",
        topic: "사용자 입력",
        color: getMindmapPaletteColor(1),
        children: [
          createMindmapNode({
            id: "mind-input-form",
            topic: "간단한 폼",
            color: getMindmapPaletteColor(1),
          }),
          createMindmapNode({
            id: "mind-input-sample",
            topic: "예시 데이터",
            color: getMindmapPaletteColor(1),
          }),
          createMindmapNode({
            id: "mind-input-color",
            topic: "색상 선택",
            color: getMindmapPaletteColor(1),
          }),
        ],
      }),
      createMindmapNode({
        id: "mind-preview",
        topic: "미리보기",
        color: getMindmapPaletteColor(2),
        children: [
          createMindmapNode({
            id: "mind-preview-live",
            topic: "실시간 반영",
            color: getMindmapPaletteColor(2),
          }),
          createMindmapNode({
            id: "mind-preview-balance",
            topic: "트리 균형",
            color: getMindmapPaletteColor(2),
          }),
          createMindmapNode({
            id: "mind-preview-export",
            topic: "PNG 확인",
            color: getMindmapPaletteColor(2),
          }),
        ],
      }),
      createMindmapNode({
        id: "mind-ops",
        topic: "운영 준비",
        color: getMindmapPaletteColor(3),
        children: [
          createMindmapNode({
            id: "mind-ops-docs",
            topic: "명세 문서",
            color: getMindmapPaletteColor(3),
          }),
          createMindmapNode({
            id: "mind-ops-test",
            topic: "테스트",
            color: getMindmapPaletteColor(3),
          }),
          createMindmapNode({
            id: "mind-ops-release",
            topic: "릴리즈 체크",
            color: getMindmapPaletteColor(3),
          }),
        ],
      }),
    ],
  });
}

export function findMindmapNode(
  root: MindmapNode,
  nodeId: string,
): MindmapNode | undefined {
  if (root.id === nodeId) {
    return root;
  }

  for (const child of root.children) {
    const match = findMindmapNode(child, nodeId);

    if (match) {
      return match;
    }
  }

  return undefined;
}

export function findMindmapParent(
  root: MindmapNode,
  nodeId: string,
): MindmapNode | undefined {
  for (const child of root.children) {
    if (child.id === nodeId) {
      return root;
    }

    const match = findMindmapParent(child, nodeId);

    if (match) {
      return match;
    }
  }

  return undefined;
}

export function flattenMindmap(root: MindmapNode): FlattenedMindmapNode[] {
  const result: FlattenedMindmapNode[] = [];

  function visit(node: MindmapNode, depth: number, parentId: string | null) {
    result.push({
      id: node.id,
      topic: node.topic,
      note: node.note,
      color: node.color,
      expanded: node.expanded,
      depth,
      parentId,
      childCount: node.children.length,
    });

    node.children.forEach((child) => visit(child, depth + 1, node.id));
  }

  visit(root, 0, null);

  return result;
}

export function countMindmapNodes(root: MindmapNode): number {
  return flattenMindmap(root).length;
}

export function getMindmapDepth(root: MindmapNode): number {
  return flattenMindmap(root).reduce(
    (maxDepth, node) => Math.max(maxDepth, node.depth + 1),
    0,
  );
}

export function getNextMindmapId(root: MindmapNode): string {
  const usedIds = new Set(flattenMindmap(root).map((node) => node.id));
  let index = usedIds.size + 1;

  while (usedIds.has(`node-${index}`)) {
    index += 1;
  }

  return `node-${index}`;
}

export function getSuggestedMindmapColor(
  root: MindmapNode,
  parentId: string,
): string {
  const parent = findMindmapNode(root, parentId);

  if (!parent) {
    return defaultGanttTaskColor;
  }

  if (parent.id === root.id) {
    return getMindmapPaletteColor(parent.children.length);
  }

  return parent.color;
}

export function updateMindmapNode(
  root: MindmapNode,
  nodeId: string,
  patch: Partial<Pick<MindmapNode, "color" | "expanded" | "note" | "topic">>,
): MindmapNode {
  const nextRoot = cloneMindmapNode(root);
  const targetNode = findMindmapNode(nextRoot, nodeId);

  if (!targetNode) {
    return nextRoot;
  }

  if (patch.topic !== undefined) {
    targetNode.topic = patch.topic;
  }

  if (patch.note !== undefined) {
    targetNode.note = patch.note;
  }

  if (patch.color !== undefined) {
    targetNode.color = normalizeGanttTaskColor(patch.color);
  }

  if (patch.expanded !== undefined) {
    targetNode.expanded = patch.expanded;
  }

  return nextRoot;
}

export function insertMindmapChild(
  root: MindmapNode,
  parentId: string,
  childNode: MindmapNode,
): MindmapNode {
  const nextRoot = cloneMindmapNode(root);
  const parentNode = findMindmapNode(nextRoot, parentId);

  if (!parentNode) {
    return nextRoot;
  }

  parentNode.children.push(cloneMindmapNode(childNode));
  parentNode.expanded = true;

  return nextRoot;
}

export function insertMindmapSibling(
  root: MindmapNode,
  nodeId: string,
  siblingNode: MindmapNode,
): MindmapNode {
  if (root.id === nodeId) {
    return insertMindmapChild(root, root.id, siblingNode);
  }

  const nextRoot = cloneMindmapNode(root);
  const parentNode = findMindmapParent(nextRoot, nodeId);

  if (!parentNode) {
    return nextRoot;
  }

  const targetIndex = parentNode.children.findIndex((node) => node.id === nodeId);

  if (targetIndex < 0) {
    return nextRoot;
  }

  parentNode.children.splice(targetIndex + 1, 0, cloneMindmapNode(siblingNode));

  return nextRoot;
}

export function removeMindmapNode(
  root: MindmapNode,
  nodeId: string,
): MindmapNode {
  if (root.id === nodeId) {
    return cloneMindmapNode(root);
  }

  const nextRoot = cloneMindmapNode(root);

  function prune(node: MindmapNode) {
    node.children = node.children.filter((child) => child.id !== nodeId);
    node.children.forEach(prune);
  }

  prune(nextRoot);

  return nextRoot;
}

export function validateMindmap(root: MindmapNode): MindmapValidationIssue[] {
  const issues: MindmapValidationIssue[] = [];

  function visit(node: MindmapNode) {
    if (!node.topic.trim()) {
      issues.push({
        nodeId: node.id,
        field: "topic",
        message: "이름은 비워둘 수 없습니다.",
      });
    }

    if (!isValidGanttTaskColor(node.color)) {
      issues.push({
        nodeId: node.id,
        field: "color",
        message: "색상은 #RRGGBB 형식이어야 합니다.",
      });
    }

    node.children.forEach(visit);
  }

  visit(root);

  return issues;
}

function toMindElixirNode(
  node: MindmapNode,
  depth: number,
  isRoot = false,
): NodeObjExport {
  const presentation = getMindmapNodePresentation(node.color, depth, isRoot);

  return {
    id: node.id,
    topic: node.topic.trim() || "제목 없음",
    note: node.note.trim(),
    expanded: node.expanded,
    branchColor: node.color,
    style: {
      color: presentation.textColor,
      background: presentation.backgroundColor,
      border: `${isRoot ? 2 : 1}px solid ${presentation.borderColor}`,
      fontWeight: isRoot || depth <= 1 ? "700" : "600",
    },
    children: node.children.map((child) =>
      toMindElixirNode(child, depth + 1, false),
    ),
  };
}

export function buildMindElixirData(root: MindmapNode): MindElixirData {
  return {
    direction: 2,
    theme: defaultMindmapTheme,
    nodeData: toMindElixirNode(root, 0, true),
  };
}
