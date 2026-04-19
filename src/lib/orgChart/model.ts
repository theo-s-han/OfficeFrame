import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";

export type OrgChartDirection = "top" | "left";
export type OrgChartStatus = "active" | "vacant" | "planned";

export type OrgChartNode = {
  color?: string;
  department?: string;
  id: string;
  name: string;
  notes?: string;
  order: number;
  parentId: string | null;
  status?: OrgChartStatus;
  title?: string;
};

export type OrgChartState = {
  direction: OrgChartDirection;
  nodes: OrgChartNode[];
  orgName: string;
  selectedNodeId?: string;
};

export type OrgChartNodeField =
  | "name"
  | "title"
  | "parentId"
  | "department"
  | "status"
  | "notes"
  | "color";

export type OrgChartValidationIssue = {
  field: OrgChartNodeField;
  message: string;
  nodeId: string;
};

export const orgChartDirectionOptions: Array<{
  label: string;
  value: OrgChartDirection;
}> = [
  { value: "top", label: "상하" },
  { value: "left", label: "좌우" },
];

export const orgChartStatusOptions: Array<{
  label: string;
  value: OrgChartStatus;
}> = [
  { value: "active", label: "운영 중" },
  { value: "vacant", label: "공석" },
  { value: "planned", label: "계획" },
];

function createNodeId(nodes: OrgChartNode[]) {
  const nextNumber =
    nodes.reduce((maxValue, node) => {
      const matched = node.id.match(/^org-(\d+)$/);

      return matched ? Math.max(maxValue, Number(matched[1])) : maxValue;
    }, 0) + 1;

  return `org-${nextNumber}`;
}

function getSuggestedOrgChartColor(index: number) {
  return (
    ganttTaskColorOptions[index % ganttTaskColorOptions.length]?.value ??
    defaultGanttTaskColor
  );
}

export function createEmptyOrgChartNode(
  nodes: OrgChartNode[],
  parentId: string | null = null,
): OrgChartNode {
  return {
    id: createNodeId(nodes),
    name: "새 항목",
    title: "",
    parentId,
    department: "",
    status: "active",
    notes: "",
    color: getSuggestedOrgChartColor(nodes.length),
    order: nodes.length,
  };
}

export function createSampleOrgChartState(): OrgChartState {
  const nodes: OrgChartNode[] = [
    {
      id: "org-1",
      name: "김현우",
      title: "프로젝트 총괄",
      parentId: null,
      department: "Office Tool",
      status: "active",
      notes: "전체 일정과 방향 조율",
      color: "#5B6EE1",
      order: 0,
    },
    {
      id: "org-2",
      name: "전략기획팀",
      title: "기획 리드",
      parentId: "org-1",
      department: "기획",
      status: "active",
      notes: "기능 범위와 요구사항 정리",
      color: "#2F7E9E",
      order: 1,
    },
    {
      id: "org-3",
      name: "프로덕트디자인팀",
      title: "디자인 리드",
      parentId: "org-1",
      department: "디자인",
      status: "active",
      notes: "문서형 시각화 품질 관리",
      color: "#4E8B63",
      order: 2,
    },
    {
      id: "org-4",
      name: "플랫폼개발팀",
      title: "개발 리드",
      parentId: "org-1",
      department: "개발",
      status: "active",
      notes: "렌더러와 export 구조 구현",
      color: "#A07A2E",
      order: 3,
    },
    {
      id: "org-5",
      name: "박지수",
      title: "서비스 기획",
      parentId: "org-2",
      department: "기획",
      status: "active",
      notes: "입력 필드와 샘플 데이터 설계",
      color: "#2F7E9E",
      order: 4,
    },
    {
      id: "org-6",
      name: "윤서연",
      title: "UX 디자이너",
      parentId: "org-3",
      department: "디자인",
      status: "active",
      notes: "카드형 preview와 문서용 비주얼 설계",
      color: "#4E8B63",
      order: 5,
    },
    {
      id: "org-7",
      name: "이동현",
      title: "프론트엔드 개발",
      parentId: "org-4",
      department: "개발",
      status: "active",
      notes: "플로우차트/조직도 shell 구현",
      color: "#A65D7B",
      order: 6,
    },
    {
      id: "org-8",
      name: "최민재",
      title: "플랫폼 QA",
      parentId: "org-4",
      department: "검수",
      status: "planned",
      notes: "이미지 export와 회귀 시나리오 검증",
      color: "#7A68B8",
      order: 7,
    },
  ];

  return {
    orgName: "Office Tool 조직도",
    direction: "top",
    nodes,
    selectedNodeId: nodes[0]?.id,
  };
}

export function addOrgChartNode(
  nodes: OrgChartNode[],
  parentId: string | null = null,
) {
  return [...nodes, createEmptyOrgChartNode(nodes, parentId)];
}

export function updateOrgChartNode(
  nodes: OrgChartNode[],
  nodeId: string,
  patch: Partial<OrgChartNode>,
) {
  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          ...patch,
        }
      : node,
  );
}

export function removeOrgChartNode(nodes: OrgChartNode[], nodeId: string) {
  const descendantIds = collectOrgChartDescendantIds(nodes, nodeId);
  const removedIds = new Set([nodeId, ...descendantIds]);

  return nodes.filter((node) => !removedIds.has(node.id));
}

function collectOrgChartDescendantIds(nodes: OrgChartNode[], nodeId: string) {
  const childrenMap = new Map<string | null, string[]>();

  nodes.forEach((node) => {
    const siblings = childrenMap.get(node.parentId) ?? [];

    siblings.push(node.id);
    childrenMap.set(node.parentId, siblings);
  });

  const collected: string[] = [];
  const queue = [...(childrenMap.get(nodeId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId) {
      continue;
    }

    collected.push(currentId);
    queue.push(...(childrenMap.get(currentId) ?? []));
  }

  return collected;
}

export function getOrgChartParentOptions(
  nodes: OrgChartNode[],
  nodeId: string,
) {
  const blockedIds = new Set([nodeId, ...collectOrgChartDescendantIds(nodes, nodeId)]);

  return nodes
    .filter((node) => !blockedIds.has(node.id))
    .sort((left, right) => left.order - right.order)
    .map((node) => ({
      value: node.id,
      label: `${node.name}${node.title ? ` · ${node.title}` : ""}`,
    }));
}

function collectOrgChartCycleIds(nodes: OrgChartNode[]) {
  const parentMap = new Map(nodes.map((node) => [node.id, node.parentId]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleIds = new Set<string>();

  function visit(nodeId: string, path: string[]) {
    if (visiting.has(nodeId)) {
      const cycleStartIndex = path.indexOf(nodeId);

      path.slice(cycleStartIndex).forEach((id) => cycleIds.add(id));
      cycleIds.add(nodeId);
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    const parentId = parentMap.get(nodeId);

    if (parentId && parentMap.has(parentId)) {
      visit(parentId, [...path, parentId]);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  nodes.forEach((node) => visit(node.id, [node.id]));

  return cycleIds;
}

function createIssue(
  nodeId: string,
  field: OrgChartNodeField,
  message: string,
): OrgChartValidationIssue {
  return {
    nodeId,
    field,
    message,
  };
}

export function validateOrgChartState(nodes: OrgChartNode[]) {
  const issues: OrgChartValidationIssue[] = [];
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  const nodeIds = new Set(nodes.map((node) => node.id));
  const cycleIds = collectOrgChartCycleIds(nodes);
  const rootNodes = nodes.filter((node) => !node.parentId);

  nodes.forEach((node) => {
    if (seenIds.has(node.id)) {
      duplicateIds.add(node.id);
    }

    seenIds.add(node.id);
  });

  nodes.forEach((node) => {
    if (!node.name.trim()) {
      issues.push(createIssue(node.id, "name", "이름을 입력하세요."));
    }

    if (node.color && !isValidGanttTaskColor(node.color)) {
      issues.push(
        createIssue(node.id, "color", "색상은 #RRGGBB 형식이어야 합니다."),
      );
    }

    if (
      node.status &&
      !orgChartStatusOptions.some((option) => option.value === node.status)
    ) {
      issues.push(
        createIssue(node.id, "status", "상태는 active, vacant, planned만 허용됩니다."),
      );
    }

    if (duplicateIds.has(node.id)) {
      issues.push(createIssue(node.id, "name", "내부 ID가 중복되었습니다."));
    }

    if (node.parentId && !nodeIds.has(node.parentId)) {
      issues.push(
        createIssue(node.id, "parentId", "존재하는 상위 항목을 선택하세요."),
      );
    }

    if (node.parentId === node.id) {
      issues.push(
        createIssue(node.id, "parentId", "자기 자신을 상위 항목으로 선택할 수 없습니다."),
      );
    }

    if (cycleIds.has(node.id)) {
      issues.push(
        createIssue(node.id, "parentId", "순환 구조는 허용되지 않습니다."),
      );
    }
  });

  if (nodes.length > 0 && rootNodes.length === 0) {
    issues.push(
      createIssue(nodes[0].id, "parentId", "최상위 항목이 하나 이상 필요합니다."),
    );
  }

  if (rootNodes.length > 1) {
    rootNodes.forEach((node) => {
      issues.push(
        createIssue(node.id, "parentId", "최상위 항목은 하나만 두는 것을 권장합니다."),
      );
    });
  }

  return issues;
}

export function getValidOrgChartNodes(nodes: OrgChartNode[]) {
  const issueNodeIds = new Set(validateOrgChartState(nodes).map((issue) => issue.nodeId));

  return nodes
    .filter((node) => !issueNodeIds.has(node.id))
    .map((node) => ({
      ...node,
      color: normalizeGanttTaskColor(node.color),
    }));
}

export function getOrgChartStatusLabel(status?: OrgChartStatus) {
  return (
    orgChartStatusOptions.find((option) => option.value === status)?.label ??
    "운영 중"
  );
}
