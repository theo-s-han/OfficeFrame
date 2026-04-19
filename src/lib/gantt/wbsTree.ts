import type { GanttTask, WbsStructureType } from "./taskModel";

export type WbsNodeKind = WbsStructureType | "work-package";

export type WbsTreeNode = {
  id: string;
  children: WbsTreeNode[];
  code: string;
  depth: number;
  kind: WbsNodeKind;
  name: string;
  notes?: string;
  order: number;
  owner?: string;
  parentId: string | null;
  status?: string;
};

export type WbsTreePreviewDatum = {
  name: string;
  attributes: Record<string, string>;
  children?: WbsTreePreviewDatum[];
};

export const defaultWbsProjectName = "오피스 툴 구축";
export const defaultWbsStructureType: WbsStructureType = "deliverable";

type DraftWbsNode = {
  children: DraftWbsNode[];
  order: number;
  task: GanttTask;
};

function getStructureLabel(structureType: WbsStructureType): string {
  return structureType === "phase" ? "단계형" : "산출물형";
}

function getKindLabel(kind: WbsNodeKind): string {
  if (kind === "phase") {
    return "단계";
  }

  if (kind === "deliverable") {
    return "산출물";
  }

  return "Work package";
}

function getStatusLabel(status?: string): string {
  if (status === "done") {
    return "완료";
  }

  if (status === "in-progress") {
    return "진행 중";
  }

  return "시작 전";
}

function normalizePreviewText(value?: string): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function buildDraftTree(tasks: GanttTask[]) {
  const nodeMap = new Map<string, DraftWbsNode>(
    tasks.map((task, index) => [
      task.id,
      {
        task,
        order: index,
        children: [],
      },
    ]),
  );
  const roots: DraftWbsNode[] = [];

  nodeMap.forEach((node) => {
    if (node.task.parentId && node.task.parentId !== node.task.id) {
      const parentNode = nodeMap.get(node.task.parentId);

      if (parentNode) {
        parentNode.children.push(node);
        return;
      }
    }

    roots.push(node);
  });

  const sortNodes = (nodes: DraftWbsNode[]): DraftWbsNode[] =>
    [...nodes]
      .sort((left, right) => left.order - right.order)
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));

  return sortNodes(roots);
}

export function buildWbsTreeNodes(
  tasks: GanttTask[],
  structureType: WbsStructureType = defaultWbsStructureType,
): WbsTreeNode[] {
  const draftTree = buildDraftTree(tasks);

  function finalizeNode(
    node: DraftWbsNode,
    parentCode: string,
    depth: number,
    index: number,
  ): WbsTreeNode {
    const code = parentCode ? `${parentCode}.${index + 1}` : `${index + 1}`;
    const children = node.children.map((child, childIndex) =>
      finalizeNode(child, code, depth + 1, childIndex),
    );
    const kind: WbsNodeKind =
      children.length > 0 ? structureType : "work-package";

    return {
      id: node.task.id,
      children,
      code,
      depth,
      kind,
      name: node.task.name,
      notes: normalizePreviewText(node.task.notes),
      order: node.order,
      owner: normalizePreviewText(node.task.owner),
      parentId: node.task.parentId || null,
      status: node.task.status || "not-started",
    };
  }

  return draftTree.map((node, index) => finalizeNode(node, "", 1, index));
}

export function flattenWbsTree(nodes: WbsTreeNode[]): WbsTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenWbsTree(node.children)]);
}

export function buildWbsPreviewData(
  tasks: GanttTask[],
  projectName: string,
  structureType: WbsStructureType = defaultWbsStructureType,
): WbsTreePreviewDatum {
  const treeNodes = buildWbsTreeNodes(tasks, structureType);

  function toPreviewDatum(node: WbsTreeNode): WbsTreePreviewDatum {
    return {
      name: node.name,
      attributes: {
        sourceId: node.id,
        code: node.code,
        kind: node.kind,
        kindLabel: getKindLabel(node.kind),
        owner: node.owner ?? "",
        status: node.status ?? "not-started",
        statusLabel: getStatusLabel(node.status),
        notes: node.notes ?? "",
        depth: String(node.depth),
      },
      children: node.children.map(toPreviewDatum),
    };
  }

  return {
    name: projectName || defaultWbsProjectName,
    attributes: {
      code: "WBS",
      kind: "project",
      kindLabel: getStructureLabel(structureType),
      owner: "",
      status: "",
      statusLabel: "",
      notes: "",
      depth: "0",
    },
    children: treeNodes.map(toPreviewDatum),
  };
}

export function collectWbsDescendantIds(
  tasks: GanttTask[],
  currentTaskId: string,
): Set<string> {
  const childMap = new Map<string, string[]>();

  tasks.forEach((task) => {
    if (!task.parentId) {
      return;
    }

    childMap.set(task.parentId, [...(childMap.get(task.parentId) ?? []), task.id]);
  });

  const descendants = new Set<string>();
  const stack = [...(childMap.get(currentTaskId) ?? [])];

  while (stack.length > 0) {
    const taskId = stack.pop();

    if (!taskId || descendants.has(taskId)) {
      continue;
    }

    descendants.add(taskId);
    stack.push(...(childMap.get(taskId) ?? []));
  }

  return descendants;
}

export function getWbsParentOptions(
  tasks: GanttTask[],
  currentTaskId: string,
  structureType: WbsStructureType = defaultWbsStructureType,
): Array<{ label: string; value: string }> {
  const blockedIds = collectWbsDescendantIds(tasks, currentTaskId);

  blockedIds.add(currentTaskId);

  const nodeLabelMap = new Map(
    flattenWbsTree(buildWbsTreeNodes(tasks, structureType)).map((node) => [
      node.id,
      `${node.code} ${node.name}`,
    ]),
  );

  return tasks
    .filter((task) => !blockedIds.has(task.id))
    .map((task) => ({
      label: nodeLabelMap.get(task.id) ?? task.name,
      value: task.id,
    }));
}
