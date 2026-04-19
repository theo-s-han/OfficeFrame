import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";

export type FlowchartDirection = "TB" | "LR";

export type FlowchartNodeType =
  | "start"
  | "process"
  | "decision"
  | "document"
  | "data"
  | "subprocess"
  | "end";

export type FlowchartBranch = {
  id: string;
  label: string;
  targetStepId: string;
};

export type FlowchartStep = {
  branches: FlowchartBranch[];
  id: string;
  label: string;
  lane?: string;
  nextStepId?: string;
  notes?: string;
  order: number;
  owner?: string;
  type: FlowchartNodeType;
};

export type FlowchartDocument = {
  direction: FlowchartDirection;
  laneMode: boolean;
  steps: FlowchartStep[];
  title: string;
};

export type FlowchartConnection = {
  branchId?: string;
  id: string;
  kind: "next" | "branch";
  label?: string;
  sourceStepId: string;
  sourceType: FlowchartNodeType;
  targetStepId: string;
};

export type FlowchartValidationIssue = {
  branchId?: string;
  connectionId?: string;
  field: "document" | "step" | "branch" | "connection";
  message: string;
  severity: "error" | "warning";
  stepId?: string;
};

export type FlowchartLayoutNode = FlowchartStep & {
  position: {
    x: number;
    y: number;
  };
  size: {
    height: number;
    width: number;
  };
};

export type FlowchartLayout = {
  connections: FlowchartConnection[];
  steps: FlowchartLayoutNode[];
};

export const flowchartDirectionOptions: Array<{
  label: string;
  value: FlowchartDirection;
}> = [
  { value: "TB", label: "위에서 아래" },
  { value: "LR", label: "왼쪽에서 오른쪽" },
];

export const flowchartNodeTypeOptions: Array<{
  label: string;
  value: FlowchartNodeType;
}> = [
  { value: "start", label: "시작" },
  { value: "process", label: "처리" },
  { value: "decision", label: "결정" },
  { value: "document", label: "문서" },
  { value: "data", label: "데이터" },
  { value: "subprocess", label: "서브프로세스" },
  { value: "end", label: "종료" },
];

const elk = new ELK();

const flowchartNodeSizes: Record<
  FlowchartNodeType,
  {
    height: number;
    width: number;
  }
> = {
  start: { width: 220, height: 92 },
  process: { width: 220, height: 120 },
  decision: { width: 220, height: 188 },
  document: { width: 220, height: 138 },
  data: { width: 220, height: 128 },
  subprocess: { width: 220, height: 120 },
  end: { width: 220, height: 92 },
};

function createStepId(steps: FlowchartStep[]) {
  const nextNumber =
    steps.reduce((maxValue, step) => {
      const matched = step.id.match(/^flow-step-(\d+)$/);

      return matched ? Math.max(maxValue, Number(matched[1])) : maxValue;
    }, 0) + 1;

  return `flow-step-${nextNumber}`;
}

function createBranchId(branches: FlowchartBranch[]) {
  const nextNumber =
    branches.reduce((maxValue, branch) => {
      const matched = branch.id.match(/^flow-branch-(\d+)$/);

      return matched ? Math.max(maxValue, Number(matched[1])) : maxValue;
    }, 0) + 1;

  return `flow-branch-${nextNumber}`;
}

function createIssue(
  severity: "error" | "warning",
  field: FlowchartValidationIssue["field"],
  message: string,
  options?: {
    branchId?: string;
    connectionId?: string;
    stepId?: string;
  },
): FlowchartValidationIssue {
  return {
    severity,
    field,
    message,
    branchId: options?.branchId,
    connectionId: options?.connectionId,
    stepId: options?.stepId,
  };
}

function createEmptyBranch(branches: FlowchartBranch[]): FlowchartBranch {
  return {
    id: createBranchId(branches),
    label: "",
    targetStepId: "",
  };
}

function createDefaultDecisionBranches(): FlowchartBranch[] {
  return [
    {
      id: "flow-branch-1",
      label: "예",
      targetStepId: "",
    },
    {
      id: "flow-branch-2",
      label: "아니오",
      targetStepId: "",
    },
  ];
}

function normalizeStepForType(step: FlowchartStep) {
  if (step.type === "decision") {
    const branches =
      step.branches.length >= 2
        ? step.branches
        : [
            ...step.branches,
            ...Array.from({ length: 2 - step.branches.length }, (_, index) =>
              createEmptyBranch([...step.branches, ...step.branches.slice(0, index)]),
            ),
          ];

    return {
      ...step,
      nextStepId: "",
      branches,
    };
  }

  if (step.type === "end") {
    return {
      ...step,
      nextStepId: "",
      branches: [],
    };
  }

  return {
    ...step,
    branches: [],
  };
}

export function createEmptyFlowchartStep(steps: FlowchartStep[]): FlowchartStep {
  return {
    id: createStepId(steps),
    label: "",
    type: "process",
    lane: "",
    owner: "",
    notes: "",
    nextStepId: "",
    branches: [],
    order: steps.length,
  };
}

export function createEmptyFlowchartDocument(): FlowchartDocument {
  return {
    title: "새 플로우차트",
    direction: "TB",
    laneMode: false,
    steps: [],
  };
}

export function createSampleFlowchartDocument(): FlowchartDocument {
  return {
    title: "문서 요청 처리 플로우",
    direction: "TB",
    laneMode: false,
    steps: [
      {
        id: "flow-step-1",
        label: "요청 접수",
        type: "start",
        owner: "PM",
        notes: "새 요청을 등록합니다.",
        nextStepId: "flow-step-2",
        branches: [],
        order: 0,
      },
      {
        id: "flow-step-2",
        label: "요청 내용 확인",
        type: "process",
        owner: "기획",
        notes: "요청 범위와 우선순위를 확인합니다.",
        nextStepId: "flow-step-3",
        branches: [],
        order: 1,
      },
      {
        id: "flow-step-3",
        label: "기존 템플릿으로 처리 가능한가?",
        type: "decision",
        owner: "리드",
        notes: "재사용 가능 여부를 판단합니다.",
        branches: [
          {
            id: "flow-branch-1",
            label: "예",
            targetStepId: "flow-step-4",
          },
          {
            id: "flow-branch-2",
            label: "아니오",
            targetStepId: "flow-step-5",
          },
        ],
        order: 2,
      },
      {
        id: "flow-step-4",
        label: "기존 문서 템플릿 수정",
        type: "document",
        owner: "기획",
        notes: "문서 구조에 맞게 수정안을 정리합니다.",
        nextStepId: "flow-step-6",
        branches: [],
        order: 3,
      },
      {
        id: "flow-step-5",
        label: "입출력 스키마 정의",
        type: "data",
        owner: "아키텍트",
        notes: "새 플로우에 필요한 입력과 출력을 정리합니다.",
        nextStepId: "flow-step-6",
        branches: [],
        order: 4,
      },
      {
        id: "flow-step-6",
        label: "구현 작업 묶음 실행",
        type: "subprocess",
        owner: "개발",
        notes: "구현과 검증 흐름을 한 묶음으로 진행합니다.",
        nextStepId: "flow-step-7",
        branches: [],
        order: 5,
      },
      {
        id: "flow-step-7",
        label: "검토 반영 필요?",
        type: "decision",
        owner: "운영",
        notes: "최종 검토 결과를 확인합니다.",
        branches: [
          {
            id: "flow-branch-3",
            label: "예",
            targetStepId: "flow-step-8",
          },
          {
            id: "flow-branch-4",
            label: "아니오",
            targetStepId: "flow-step-9",
          },
        ],
        order: 6,
      },
      {
        id: "flow-step-8",
        label: "문서 반영 완료",
        type: "document",
        nextStepId: "flow-step-9",
        owner: "운영",
        notes: "문서와 PPT에 결과를 반영합니다.",
        branches: [],
        order: 7,
      },
      {
        id: "flow-step-9",
        label: "완료",
        type: "end",
        owner: "운영",
        notes: "최종 결과를 완료 상태로 마무리합니다.",
        branches: [],
        order: 8,
      },
    ],
  };
}

export function addFlowchartStep(steps: FlowchartStep[]) {
  return [...steps, createEmptyFlowchartStep(steps)];
}

export function updateFlowchartStep(
  steps: FlowchartStep[],
  stepId: string,
  patch: Partial<FlowchartStep>,
) {
  return steps.map((step) => {
    if (step.id !== stepId) {
      return step;
    }

    const nextStep = normalizeStepForType({
      ...step,
      ...patch,
    });

    if (step.type !== "decision" && nextStep.type === "decision" && step.branches.length === 0) {
      return {
        ...nextStep,
        branches: createDefaultDecisionBranches(),
      };
    }

    if (step.type === "decision" && nextStep.type !== "decision") {
      return {
        ...nextStep,
        nextStepId: step.branches[0]?.targetStepId ?? "",
      };
    }

    return nextStep;
  });
}

export function removeFlowchartStep(steps: FlowchartStep[], stepId: string) {
  const remainingSteps = steps.filter((step) => step.id !== stepId);

  return remainingSteps.map((step, index) =>
    normalizeStepForType({
      ...step,
      nextStepId: step.nextStepId === stepId ? "" : step.nextStepId,
      branches: step.branches
        .map((branch) =>
          branch.targetStepId === stepId
            ? {
                ...branch,
                targetStepId: "",
              }
            : branch,
        )
        .filter((branch) => step.type === "decision" || branch.targetStepId !== stepId),
      order: index,
    }),
  );
}

export function addFlowchartBranch(steps: FlowchartStep[], stepId: string) {
  return steps.map((step) =>
    step.id === stepId && step.type === "decision"
      ? {
          ...step,
          branches: [...step.branches, createEmptyBranch(step.branches)],
        }
      : step,
  );
}

export function updateFlowchartBranch(
  steps: FlowchartStep[],
  stepId: string,
  branchId: string,
  patch: Partial<FlowchartBranch>,
) {
  return steps.map((step) =>
    step.id === stepId && step.type === "decision"
      ? {
          ...step,
          branches: step.branches.map((branch) =>
            branch.id === branchId
              ? {
                  ...branch,
                  ...patch,
                }
              : branch,
          ),
        }
      : step,
  );
}

export function removeFlowchartBranch(
  steps: FlowchartStep[],
  stepId: string,
  branchId: string,
) {
  return steps.map((step) =>
    step.id === stepId && step.type === "decision"
      ? {
          ...step,
          branches: step.branches.filter((branch) => branch.id !== branchId),
        }
      : step,
  );
}

export function getFlowchartStepOptions(
  steps: FlowchartStep[],
  excludeId?: string,
) {
  return steps
    .filter((step) => step.id !== excludeId)
    .sort((left, right) => left.order - right.order)
    .map((step) => ({
      value: step.id,
      label: step.label.trim() || `단계 ${step.order + 1}`,
    }));
}

export function getFlowchartConnections(document: FlowchartDocument) {
  const connections: FlowchartConnection[] = [];

  document.steps.forEach((step) => {
    if (step.type === "decision") {
      step.branches.forEach((branch) => {
        if (!branch.targetStepId) {
          return;
        }

        connections.push({
          id: `${step.id}:${branch.id}`,
          kind: "branch",
          branchId: branch.id,
          label: branch.label.trim(),
          sourceStepId: step.id,
          sourceType: step.type,
          targetStepId: branch.targetStepId,
        });
      });
      return;
    }

    if (step.type === "end" || !step.nextStepId) {
      return;
    }

    connections.push({
      id: `${step.id}:next`,
      kind: "next",
      label: "",
      sourceStepId: step.id,
      sourceType: step.type,
      targetStepId: step.nextStepId,
    });
  });

  return connections;
}

export function getRenderableFlowchartConnections(document: FlowchartDocument) {
  const stepIds = new Set(document.steps.map((step) => step.id));

  return getFlowchartConnections(document).filter(
    (connection) =>
      connection.sourceStepId !== connection.targetStepId &&
      stepIds.has(connection.sourceStepId) &&
      stepIds.has(connection.targetStepId),
  );
}

function findCycles(connections: FlowchartConnection[]) {
  const adjacency = new Map<string, string[]>();
  const visited = new Set<string>();
  const stack = new Set<string>();

  connections.forEach((connection) => {
    adjacency.set(connection.sourceStepId, [
      ...(adjacency.get(connection.sourceStepId) ?? []),
      connection.targetStepId,
    ]);
  });

  function visit(stepId: string): boolean {
    if (stack.has(stepId)) {
      return true;
    }

    if (visited.has(stepId)) {
      return false;
    }

    visited.add(stepId);
    stack.add(stepId);

    const hasCycle = (adjacency.get(stepId) ?? []).some((targetStepId) =>
      visit(targetStepId),
    );

    stack.delete(stepId);
    return hasCycle;
  }

  return Array.from(adjacency.keys()).some((stepId) => visit(stepId));
}

export function validateFlowchartDocument(document: FlowchartDocument) {
  const issues: FlowchartValidationIssue[] = [];
  const seenStepIds = new Set<string>();
  const stepIds = new Set(document.steps.map((step) => step.id));
  const connections = getFlowchartConnections(document);
  const validConnections: FlowchartConnection[] = [];
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  if (!document.title.trim()) {
    issues.push(createIssue("error", "document", "플로우차트명을 입력해 주세요."));
  }

  if (document.steps.length < 2) {
    issues.push(
      createIssue(
        "error",
        "document",
        "플로우차트는 최소 2개 이상의 단계가 필요합니다.",
      ),
    );
  }

  document.steps.forEach((step) => {
    if (seenStepIds.has(step.id)) {
      issues.push(
        createIssue("error", "step", "단계 ID가 중복되었습니다.", {
          stepId: step.id,
        }),
      );
    }

    seenStepIds.add(step.id);

    if (!step.label.trim()) {
      issues.push(
        createIssue("error", "step", "단계명을 입력해 주세요.", {
          stepId: step.id,
        }),
      );
    }

    if (step.type === "decision") {
      const seenBranchLabels = new Set<string>();

      if (step.branches.length < 2) {
        issues.push(
          createIssue(
            "error",
            "step",
            "결정 단계에는 최소 2개 이상의 분기가 필요합니다.",
            {
              stepId: step.id,
            },
          ),
        );
      }

      step.branches.forEach((branch) => {
        const normalizedLabel = branch.label.trim().toLowerCase();

        if (!branch.label.trim()) {
          issues.push(
            createIssue("error", "branch", "분기 라벨을 입력해 주세요.", {
              stepId: step.id,
              branchId: branch.id,
            }),
          );
        }

        if (!branch.targetStepId) {
          issues.push(
            createIssue("error", "branch", "분기 대상 단계를 선택해 주세요.", {
              stepId: step.id,
              branchId: branch.id,
            }),
          );
        }

        if (normalizedLabel) {
          if (seenBranchLabels.has(normalizedLabel)) {
            issues.push(
              createIssue(
                "error",
                "branch",
                "같은 결정 단계 안에서 분기 라벨은 중복될 수 없습니다.",
                {
                  stepId: step.id,
                  branchId: branch.id,
                },
              ),
            );
          }

          seenBranchLabels.add(normalizedLabel);
        }
      });

      return;
    }

    if (step.type === "end") {
      if (step.nextStepId || step.branches.length > 0) {
        issues.push(
          createIssue(
            "error",
            "step",
            "종료 단계에는 다음 단계나 분기를 둘 수 없습니다.",
            {
              stepId: step.id,
            },
          ),
        );
      }

      return;
    }

    if (!step.nextStepId) {
      issues.push(
        createIssue("error", "step", "다음 단계를 선택해 주세요.", {
          stepId: step.id,
        }),
      );
    }

    if (step.branches.length > 0) {
      issues.push(
        createIssue(
          "error",
          "step",
          "분기 입력은 결정 단계에서만 사용할 수 있습니다.",
          {
            stepId: step.id,
          },
        ),
      );
    }
  });

  connections.forEach((connection) => {
    if (!stepIds.has(connection.sourceStepId) || !stepIds.has(connection.targetStepId)) {
      issues.push(
        createIssue(
          "error",
          "connection",
          "존재하는 단계끼리만 연결할 수 있습니다.",
          {
            connectionId: connection.id,
          },
        ),
      );
      return;
    }

    if (connection.sourceStepId === connection.targetStepId) {
      issues.push(
        createIssue(
          "error",
          "connection",
          "자기 자신으로 연결할 수 없습니다.",
          {
            connectionId: connection.id,
          },
        ),
      );
      return;
    }

    validConnections.push(connection);
    incoming.set(
      connection.targetStepId,
      (incoming.get(connection.targetStepId) ?? 0) + 1,
    );
    outgoing.set(
      connection.sourceStepId,
      (outgoing.get(connection.sourceStepId) ?? 0) + 1,
    );
  });

  const startSteps = document.steps.filter((step) => step.type === "start");
  const endSteps = document.steps.filter((step) => step.type === "end");

  if (startSteps.length !== 1) {
    issues.push(
      createIssue(
        "error",
        "document",
        "시작 단계는 정확히 1개여야 합니다.",
        {
          stepId: startSteps[0]?.id,
        },
      ),
    );
  }

  if (endSteps.length === 0) {
    issues.push(
      createIssue(
        "error",
        "document",
        "종료 단계는 최소 1개 이상 있어야 합니다.",
      ),
    );
  }

  document.steps.forEach((step) => {
    const currentIncoming = incoming.get(step.id) ?? 0;
    const currentOutgoing = outgoing.get(step.id) ?? 0;

    if (step.type === "start") {
      if (currentIncoming > 0) {
        issues.push(
          createIssue(
            "error",
            "step",
            "시작 단계에는 들어오는 연결이 없어야 합니다.",
            {
              stepId: step.id,
            },
          ),
        );
      }

      if (currentOutgoing !== 1) {
        issues.push(
          createIssue(
            "error",
            "step",
            "시작 단계는 정확히 1개의 다음 단계를 가져야 합니다.",
            {
              stepId: step.id,
            },
          ),
        );
      }
    }

    if (step.type === "end" && currentOutgoing > 0) {
      issues.push(
        createIssue(
          "error",
          "step",
          "종료 단계에서 나가는 연결은 허용되지 않습니다.",
          {
            stepId: step.id,
          },
        ),
      );
    }

    if (step.type === "decision" && currentOutgoing < 2) {
      issues.push(
        createIssue(
          "error",
          "step",
          "결정 단계는 최소 2개 이상의 분기를 가져야 합니다.",
          {
            stepId: step.id,
          },
        ),
      );
    }

    if (
      step.type !== "decision" &&
      step.type !== "end" &&
      currentOutgoing > 1
    ) {
      issues.push(
        createIssue(
          "error",
          "step",
          "이 단계 유형은 한 번에 하나의 다음 단계만 가질 수 있습니다.",
          {
            stepId: step.id,
          },
        ),
      );
    }
  });

  if (startSteps.length === 1) {
    const visited = new Set<string>();
    const queue = [startSteps[0].id];
    const adjacency = new Map<string, string[]>();

    validConnections.forEach((connection) => {
      adjacency.set(connection.sourceStepId, [
        ...(adjacency.get(connection.sourceStepId) ?? []),
        connection.targetStepId,
      ]);
    });

    while (queue.length > 0) {
      const currentStepId = queue.shift();

      if (!currentStepId || visited.has(currentStepId)) {
        continue;
      }

      visited.add(currentStepId);
      (adjacency.get(currentStepId) ?? []).forEach((targetStepId) => {
        if (!visited.has(targetStepId)) {
          queue.push(targetStepId);
        }
      });
    }

    document.steps.forEach((step) => {
      if (!visited.has(step.id)) {
        issues.push(
          createIssue(
            "error",
            "step",
            "시작 단계에서 도달할 수 없는 단계입니다.",
            {
              stepId: step.id,
            },
          ),
        );
      }
    });
  }

  document.steps.forEach((step) => {
    const currentIncoming = incoming.get(step.id) ?? 0;
    const currentOutgoing = outgoing.get(step.id) ?? 0;

    if (document.steps.length > 1 && currentIncoming === 0 && currentOutgoing === 0) {
      issues.push(
        createIssue("error", "step", "고립된 단계는 허용되지 않습니다.", {
          stepId: step.id,
        }),
      );
    }
  });

  if (findCycles(validConnections)) {
    issues.push(
      createIssue(
        "warning",
        "document",
        "순환 흐름이 감지되었습니다. 결정 분기를 통한 반복이 맞는지 확인해 주세요.",
      ),
    );
  }

  return issues;
}

export function hasBlockingFlowchartIssues(issues: FlowchartValidationIssue[]) {
  return issues.some((issue) => issue.severity === "error");
}

function getRenderableSteps(document: FlowchartDocument) {
  return document.steps.map((step) => ({
    ...step,
    label: step.label.trim() || "이름 없는 단계",
    lane: document.laneMode ? step.lane?.trim() ?? "" : "",
    owner: step.owner?.trim() ?? "",
    notes: step.notes?.trim() ?? "",
  }));
}

function createFallbackFlowchartLayout(
  steps: ReturnType<typeof getRenderableSteps>,
  connections: FlowchartConnection[],
  direction: FlowchartDirection,
): FlowchartLayout {
  const outgoing = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();

  steps.forEach((step) => {
    incomingCount.set(step.id, 0);
  });

  connections.forEach((connection) => {
    outgoing.set(connection.sourceStepId, [
      ...(outgoing.get(connection.sourceStepId) ?? []),
      connection.targetStepId,
    ]);
    incomingCount.set(
      connection.targetStepId,
      (incomingCount.get(connection.targetStepId) ?? 0) + 1,
    );
  });

  const queue = steps
    .filter((step) => step.type === "start")
    .map((step) => step.id);

  if (queue.length === 0 && steps[0]) {
    queue.push(steps[0].id);
  }

  const ranks = new Map<string, number>(queue.map((stepId) => [stepId, 0]));
  const remainingIncoming = new Map(incomingCount);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentStepId = queue.shift();

    if (!currentStepId || visited.has(currentStepId)) {
      continue;
    }

    visited.add(currentStepId);
    const currentRank = ranks.get(currentStepId) ?? 0;

    (outgoing.get(currentStepId) ?? []).forEach((targetStepId) => {
      ranks.set(targetStepId, Math.max(ranks.get(targetStepId) ?? 0, currentRank + 1));
      remainingIncoming.set(
        targetStepId,
        Math.max((remainingIncoming.get(targetStepId) ?? 0) - 1, 0),
      );

      if ((remainingIncoming.get(targetStepId) ?? 0) === 0) {
        queue.push(targetStepId);
      }
    });
  }

  let fallbackRank = Math.max(0, ...Array.from(ranks.values()));

  steps.forEach((step) => {
    if (!ranks.has(step.id)) {
      fallbackRank += 1;
      ranks.set(step.id, fallbackRank);
    }
  });

  const layers = new Map<number, typeof steps>();

  steps.forEach((step) => {
    const rank = ranks.get(step.id) ?? 0;
    layers.set(rank, [...(layers.get(rank) ?? []), step]);
  });

  const orderedLayers = Array.from(layers.entries())
    .sort(([left], [right]) => left - right)
    .map(([rank, layer]) => [rank, [...layer].sort((left, right) => left.order - right.order)] as const);
  const maxLayerSize = Math.max(...orderedLayers.map(([, layer]) => layer.length));
  const horizontalGap = 96;
  const verticalGap = 112;
  const maxNodeWidth = Math.max(...steps.map((step) => flowchartNodeSizes[step.type].width));
  const maxNodeHeight = Math.max(...steps.map((step) => flowchartNodeSizes[step.type].height));
  const positions = new Map<string, { x: number; y: number }>();

  orderedLayers.forEach(([rank, layer]) => {
    const layerOffset = ((maxLayerSize - layer.length) * (maxNodeWidth + horizontalGap)) / 2;

    layer.forEach((step, index) => {
      if (direction === "LR") {
        positions.set(step.id, {
          x: 40 + rank * (maxNodeWidth + 164),
          y: 40 + layerOffset + index * (maxNodeHeight + verticalGap),
        });
        return;
      }

      positions.set(step.id, {
        x: 40 + layerOffset + index * (maxNodeWidth + horizontalGap),
        y: 40 + rank * (maxNodeHeight + 136),
      });
    });
  });

  return {
    steps: steps.map((step) => ({
      ...step,
      position: positions.get(step.id) ?? { x: 40, y: 40 },
      size: flowchartNodeSizes[step.type],
    })),
    connections,
  };
}

export function getFallbackFlowchartLayout(
  document: FlowchartDocument,
): FlowchartLayout {
  const steps = getRenderableSteps(document);
  const connections = getRenderableFlowchartConnections(document);

  if (steps.length === 0) {
    return {
      steps: [],
      connections: [],
    };
  }

  return createFallbackFlowchartLayout(steps, connections, document.direction);
}

export async function layoutFlowchartDocument(
  document: FlowchartDocument,
): Promise<FlowchartLayout> {
  const steps = getRenderableSteps(document);
  const connections = getRenderableFlowchartConnections(document);

  if (steps.length === 0) {
    return {
      steps: [],
      connections: [],
    };
  }

  const graph: ElkNode = {
    id: "flowchart-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": document.direction === "LR" ? "RIGHT" : "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.spacing.edgeNodeBetweenLayers": "36",
      "elk.layered.spacing.nodeNodeBetweenLayers": "92",
      "elk.spacing.edgeNode": "28",
      "elk.spacing.nodeNode": "36",
    },
    children: steps.map((step) => ({
      id: step.id,
      width: flowchartNodeSizes[step.type].width,
      height: flowchartNodeSizes[step.type].height,
    })),
    edges: connections.map<ElkExtendedEdge>((connection) => ({
      id: connection.id,
      sources: [connection.sourceStepId],
      targets: [connection.targetStepId],
    })),
  };

  try {
    const layout = await Promise.race<ElkNode>([
      elk.layout(graph),
      new Promise<ElkNode>((_, reject) => {
        setTimeout(() => {
          reject(new Error("ELK layout timed out"));
        }, 400);
      }),
    ]);
    const positions = new Map(
      (layout.children ?? []).map((child) => [
        child.id,
        {
          x: child.x ?? 0,
          y: child.y ?? 0,
        },
      ]),
    );

    return {
      steps: steps.map((step) => ({
        ...step,
        position: {
          x: (positions.get(step.id)?.x ?? 0) + 28,
          y: (positions.get(step.id)?.y ?? 0) + 28,
        },
        size: flowchartNodeSizes[step.type],
      })),
      connections,
    };
  } catch {
    return createFallbackFlowchartLayout(steps, connections, document.direction);
  }
}
