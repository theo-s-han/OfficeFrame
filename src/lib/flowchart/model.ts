import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";

export type FlowchartNodeType =
  | "start"
  | "process"
  | "decision"
  | "end"
  | "document"
  | "data";

export type FlowchartNodeStatus = "default" | "active" | "warning";

export type FlowchartNode = {
  color?: string;
  id: string;
  lane?: string;
  name: string;
  notes?: string;
  order: number;
  owner?: string;
  status?: FlowchartNodeStatus;
  type: FlowchartNodeType;
};

export type FlowchartEdge = {
  id: string;
  label?: string;
  sourceId: string;
  targetId: string;
};

export type FlowchartState = {
  edges: FlowchartEdge[];
  nodes: FlowchartNode[];
  selectedNodeId?: string;
  title: string;
};

export type FlowchartValidationIssue = {
  edgeId?: string;
  field: "node" | "edge";
  message: string;
  nodeId?: string;
};

export const flowchartNodeTypeOptions: Array<{
  label: string;
  value: FlowchartNodeType;
}> = [
  { value: "start", label: "시작" },
  { value: "process", label: "처리" },
  { value: "decision", label: "결정" },
  { value: "end", label: "종료" },
  { value: "document", label: "문서" },
  { value: "data", label: "데이터" },
];

export const flowchartStatusOptions: Array<{
  label: string;
  value: FlowchartNodeStatus;
}> = [
  { value: "default", label: "기본" },
  { value: "active", label: "진행" },
  { value: "warning", label: "주의" },
];

function createNodeId(nodes: FlowchartNode[]) {
  const nextNumber =
    nodes.reduce((maxValue, node) => {
      const matched = node.id.match(/^flow-node-(\d+)$/);

      return matched ? Math.max(maxValue, Number(matched[1])) : maxValue;
    }, 0) + 1;

  return `flow-node-${nextNumber}`;
}

function createEdgeId(edges: FlowchartEdge[]) {
  const nextNumber =
    edges.reduce((maxValue, edge) => {
      const matched = edge.id.match(/^flow-edge-(\d+)$/);

      return matched ? Math.max(maxValue, Number(matched[1])) : maxValue;
    }, 0) + 1;

  return `flow-edge-${nextNumber}`;
}

function getSuggestedFlowchartColor(index: number) {
  return (
    ganttTaskColorOptions[index % ganttTaskColorOptions.length]?.value ??
    defaultGanttTaskColor
  );
}

export function createEmptyFlowchartNode(nodes: FlowchartNode[]): FlowchartNode {
  return {
    id: createNodeId(nodes),
    name: "새 단계",
    type: "process",
    lane: "",
    status: "default",
    owner: "",
    notes: "",
    color: getSuggestedFlowchartColor(nodes.length),
    order: nodes.length,
  };
}

export function createEmptyFlowchartEdge(
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
): FlowchartEdge {
  const fallbackSourceId = nodes[0]?.id ?? "";
  const fallbackTargetId = nodes[1]?.id ?? fallbackSourceId;

  return {
    id: createEdgeId(edges),
    sourceId: fallbackSourceId,
    targetId: fallbackTargetId,
    label: "",
  };
}

export function createSampleFlowchartState(): FlowchartState {
  const nodes: FlowchartNode[] = [
    {
      id: "flow-node-1",
      name: "요청 접수",
      type: "start",
      lane: "접수",
      status: "active",
      owner: "PM",
      notes: "새 요청을 등록합니다.",
      color: "#5B6EE1",
      order: 0,
    },
    {
      id: "flow-node-2",
      name: "요건 확인",
      type: "process",
      lane: "기획",
      status: "active",
      owner: "Planner",
      notes: "범위와 우선순위를 확인합니다.",
      color: "#2F7E9E",
      order: 1,
    },
    {
      id: "flow-node-3",
      name: "구조 적합성 판단",
      type: "decision",
      lane: "검토",
      status: "warning",
      owner: "Lead",
      notes: "기존 템플릿으로 처리 가능한지 결정합니다.",
      color: "#A07A2E",
      order: 2,
    },
    {
      id: "flow-node-4",
      name: "빠른 수정안 작성",
      type: "document",
      lane: "기획",
      status: "default",
      owner: "Planner",
      notes: "기존 구조에 맞는 변경안을 정리합니다.",
      color: "#4E8B63",
      order: 3,
    },
    {
      id: "flow-node-5",
      name: "신규 도구 설계",
      type: "data",
      lane: "설계",
      status: "default",
      owner: "Architect",
      notes: "입력/출력과 오픈소스 선택을 정리합니다.",
      color: "#A65D7B",
      order: 4,
    },
    {
      id: "flow-node-6",
      name: "구현 및 검증",
      type: "process",
      lane: "개발",
      status: "default",
      owner: "Dev",
      notes: "preview, export, validation을 함께 검증합니다.",
      color: "#7A68B8",
      order: 5,
    },
    {
      id: "flow-node-7",
      name: "문서 반영",
      type: "end",
      lane: "완료",
      status: "default",
      owner: "Ops",
      notes: "결과를 문서/PPT에 붙여넣습니다.",
      color: "#5B6EE1",
      order: 6,
    },
  ];
  const edges: FlowchartEdge[] = [
    { id: "flow-edge-1", sourceId: "flow-node-1", targetId: "flow-node-2", label: "" },
    { id: "flow-edge-2", sourceId: "flow-node-2", targetId: "flow-node-3", label: "" },
    { id: "flow-edge-3", sourceId: "flow-node-3", targetId: "flow-node-4", label: "예" },
    { id: "flow-edge-4", sourceId: "flow-node-3", targetId: "flow-node-5", label: "아니오" },
    { id: "flow-edge-5", sourceId: "flow-node-4", targetId: "flow-node-6", label: "" },
    { id: "flow-edge-6", sourceId: "flow-node-5", targetId: "flow-node-6", label: "" },
    { id: "flow-edge-7", sourceId: "flow-node-6", targetId: "flow-node-7", label: "" },
  ];

  return {
    title: "Office Tool 문서 처리 흐름",
    nodes,
    edges,
    selectedNodeId: nodes[0]?.id,
  };
}

export function addFlowchartNode(nodes: FlowchartNode[]) {
  return [...nodes, createEmptyFlowchartNode(nodes)];
}

export function updateFlowchartNode(
  nodes: FlowchartNode[],
  nodeId: string,
  patch: Partial<FlowchartNode>,
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

export function removeFlowchartNode(
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
  nodeId: string,
) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter(
      (edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId,
    ),
  };
}

export function addFlowchartEdge(
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
) {
  return [...edges, createEmptyFlowchartEdge(nodes, edges)];
}

export function updateFlowchartEdge(
  edges: FlowchartEdge[],
  edgeId: string,
  patch: Partial<FlowchartEdge>,
) {
  return edges.map((edge) =>
    edge.id === edgeId
      ? {
          ...edge,
          ...patch,
        }
      : edge,
  );
}

export function removeFlowchartEdge(edges: FlowchartEdge[], edgeId: string) {
  return edges.filter((edge) => edge.id !== edgeId);
}

export function getFlowchartNodeOptions(nodes: FlowchartNode[], excludeId?: string) {
  return nodes
    .filter((node) => node.id !== excludeId)
    .sort((left, right) => left.order - right.order)
    .map((node) => ({
      value: node.id,
      label: `${node.name}${node.lane ? ` · ${node.lane}` : ""}`,
    }));
}

function createIssue(
  field: "node" | "edge",
  message: string,
  options?: {
    edgeId?: string;
    nodeId?: string;
  },
): FlowchartValidationIssue {
  return {
    field,
    message,
    edgeId: options?.edgeId,
    nodeId: options?.nodeId,
  };
}

export function validateFlowchartState(state: FlowchartState) {
  const issues: FlowchartValidationIssue[] = [];
  const nodeIds = new Set(state.nodes.map((node) => node.id));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  const seenNodeIds = new Set<string>();
  const seenEdgeIds = new Set<string>();

  state.nodes.forEach((node) => {
    if (seenNodeIds.has(node.id)) {
      issues.push(createIssue("node", "내부 ID가 중복되었습니다.", { nodeId: node.id }));
    }

    seenNodeIds.add(node.id);

    if (!node.name.trim()) {
      issues.push(createIssue("node", "단계명을 입력하세요.", { nodeId: node.id }));
    }

    if (node.color && !isValidGanttTaskColor(node.color)) {
      issues.push(
        createIssue("node", "색상은 #RRGGBB 형식이어야 합니다.", { nodeId: node.id }),
      );
    }
  });

  state.edges.forEach((edge) => {
    if (seenEdgeIds.has(edge.id)) {
      issues.push(createIssue("edge", "연결 ID가 중복되었습니다.", { edgeId: edge.id }));
    }

    seenEdgeIds.add(edge.id);

    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      issues.push(
        createIssue("edge", "존재하는 단계끼리만 연결할 수 있습니다.", {
          edgeId: edge.id,
        }),
      );
      return;
    }

    if (edge.sourceId === edge.targetId) {
      issues.push(
        createIssue("edge", "자기 자신으로 연결할 수 없습니다.", {
          edgeId: edge.id,
        }),
      );
    }

    incoming.set(edge.targetId, (incoming.get(edge.targetId) ?? 0) + 1);
    outgoing.set(edge.sourceId, (outgoing.get(edge.sourceId) ?? 0) + 1);
  });

  const startNodes = state.nodes.filter((node) => node.type === "start");
  const endNodes = state.nodes.filter((node) => node.type === "end");

  if (startNodes.length === 0 && state.nodes[0]) {
    issues.push(
      createIssue("node", "시작 단계가 하나 이상 필요합니다.", {
        nodeId: state.nodes[0].id,
      }),
    );
  }

  if (endNodes.length === 0 && state.nodes[0]) {
    issues.push(
      createIssue("node", "종료 단계가 하나 이상 필요합니다.", {
        nodeId: state.nodes[0].id,
      }),
    );
  }

  startNodes.forEach((node) => {
    if ((incoming.get(node.id) ?? 0) > 0) {
      issues.push(
        createIssue("node", "시작 단계에는 들어오는 연결이 없어야 합니다.", {
          nodeId: node.id,
        }),
      );
    }
  });

  endNodes.forEach((node) => {
    if ((outgoing.get(node.id) ?? 0) > 0) {
      issues.push(
        createIssue("node", "종료 단계에서는 나가는 연결을 만들 수 없습니다.", {
          nodeId: node.id,
        }),
      );
    }
  });

  return issues;
}

export function getValidFlowchartState(state: FlowchartState) {
  const issues = validateFlowchartState(state);
  const invalidNodeIds = new Set(
    issues.filter((issue) => issue.nodeId).map((issue) => issue.nodeId as string),
  );
  const invalidEdgeIds = new Set(
    issues.filter((issue) => issue.edgeId).map((issue) => issue.edgeId as string),
  );
  const nodes = state.nodes
    .filter((node) => !invalidNodeIds.has(node.id))
    .map((node) => ({
      ...node,
      color: normalizeGanttTaskColor(node.color),
    }));
  const validNodeIds = new Set(nodes.map((node) => node.id));
  const edges = state.edges.filter(
    (edge) =>
      !invalidEdgeIds.has(edge.id) &&
      validNodeIds.has(edge.sourceId) &&
      validNodeIds.has(edge.targetId),
  );

  return {
    nodes,
    edges,
  };
}

export function buildFlowchartLayout(state: FlowchartState) {
  const { nodes, edges } = getValidFlowchartState(state);
  const incoming = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>(nodes.map((node) => [node.id, []]));

  edges.forEach((edge) => {
    incoming.set(edge.targetId, (incoming.get(edge.targetId) ?? 0) + 1);
    outgoing.set(edge.sourceId, [...(outgoing.get(edge.sourceId) ?? []), edge.targetId]);
  });

  const starts = nodes
    .filter((node) => (incoming.get(node.id) ?? 0) === 0)
    .sort((left, right) => left.order - right.order);
  const queue = starts.length > 0 ? [...starts.map((node) => node.id)] : [nodes[0]?.id ?? ""];
  const levels = new Map<string, number>();

  queue.forEach((nodeId) => levels.set(nodeId, 0));

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId) {
      continue;
    }

    const currentLevel = levels.get(currentId) ?? 0;

    (outgoing.get(currentId) ?? []).forEach((targetId) => {
      const nextLevel = currentLevel + 1;

      if ((levels.get(targetId) ?? -1) < nextLevel) {
        levels.set(targetId, nextLevel);
      }

      if (!queue.includes(targetId)) {
        queue.push(targetId);
      }
    });
  }

  nodes.forEach((node, index) => {
    if (!levels.has(node.id)) {
      levels.set(node.id, (levels.get(nodes[index - 1]?.id ?? "") ?? 0) + 1);
    }
  });

  const laneOrder = Array.from(
    new Set(nodes.map((node) => node.lane?.trim() || "기본 흐름")),
  );
  const groups = new Map<string, FlowchartNode[]>();

  nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    const lane = node.lane?.trim() || "기본 흐름";
    const key = `${level}:${lane}`;
    const bucket = groups.get(key) ?? [];

    bucket.push(node);
    groups.set(key, bucket);
  });

  const positionedNodes = nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const lane = node.lane?.trim() || "기본 흐름";
    const laneIndex = laneOrder.indexOf(lane);
    const key = `${level}:${lane}`;
    const bucket = (groups.get(key) ?? []).sort((left, right) => left.order - right.order);
    const rowIndex = bucket.findIndex((candidate) => candidate.id === node.id);

    return {
      ...node,
      position: {
        x: level * 280,
        y: laneIndex * 220 + Math.max(0, rowIndex) * 132,
      },
    };
  });

  return {
    nodes: positionedNodes,
    edges,
  };
}
