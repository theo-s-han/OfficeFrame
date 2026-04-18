import {
  createTaskId,
  getTodayDateString,
  type GanttChartType,
  type GanttTask,
  type GanttViewMode,
} from "./taskModel";

export type GanttChartTypeConfig = {
  id: GanttChartType;
  name: string;
  shortName: string;
  description: string;
  editorTitle: string;
  editorHelp: string;
  previewTitle: string;
  previewHelp: string;
  defaultViewMode: GanttViewMode;
  taskNameLabel: string;
  startLabel: string;
  endLabel: string;
  progressLabel: string;
  phaseLabel: string;
  ownerLabel: string;
  statusLabel: string;
  baselineStartLabel: string;
  baselineEndLabel: string;
  dependenciesLabel: string;
  fields: {
    phase: boolean;
    owner: boolean;
    status: boolean;
    baseline: boolean;
    dependencies: boolean;
    end: boolean;
    progress: boolean;
  };
};

export const ganttChartTypes: GanttChartTypeConfig[] = [
  {
    id: "project",
    name: "기본 일정표",
    shortName: "기본",
    description: "작업 기간과 진행률을 가장 익숙한 간트 형태로 정리합니다.",
    editorTitle: "작업 입력",
    editorHelp: "작업명, 시작일, 종료일, 진행률을 입력합니다.",
    previewTitle: "기본 일정표 preview",
    previewHelp: "문서에 넣기 좋은 표준 간트 차트입니다.",
    defaultViewMode: "Week",
    taskNameLabel: "Task",
    startLabel: "Start",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "Phase",
    ownerLabel: "Owner",
    statusLabel: "Status",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "Depends on",
    fields: {
      phase: false,
      owner: true,
      status: false,
      baseline: false,
      dependencies: false,
      end: true,
      progress: true,
    },
  },
  {
    id: "milestones",
    name: "마일스톤형",
    shortName: "마일스톤",
    description: "승인, 릴리즈, 마감 같은 단일 시점을 의존성과 함께 봅니다.",
    editorTitle: "마일스톤 입력",
    editorHelp:
      "section, status, dependsOn, critical로 주요 시점을 정의합니다.",
    previewTitle: "마일스톤 preview",
    previewHelp: "인터랙티브 일정과 문서용 Mermaid Gantt를 분리해 보여줍니다.",
    defaultViewMode: "Week",
    taskNameLabel: "Milestone",
    startLabel: "Date",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "Section",
    ownerLabel: "Owner",
    statusLabel: "Status",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "Depends on",
    fields: {
      phase: false,
      owner: true,
      status: true,
      baseline: false,
      dependencies: true,
      end: false,
      progress: false,
    },
  },
  {
    id: "wbs",
    name: "WBS/단계형",
    shortName: "WBS",
    description:
      "작업 분해 구조, 상위 그룹, leaf task, milestone을 함께 봅니다.",
    editorTitle: "WBS 입력",
    editorHelp:
      "code, parentId, nodeType으로 구조를 만들고 일정과 담당자를 붙입니다.",
    previewTitle: "WBS preview",
    previewHelp: "일정표와 TreeView/Mindmap 문서 미리보기를 함께 확인합니다.",
    defaultViewMode: "Week",
    taskNameLabel: "Work package",
    startLabel: "Start",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "Stage",
    ownerLabel: "Owner",
    statusLabel: "Status",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "Depends on",
    fields: {
      phase: true,
      owner: true,
      status: false,
      baseline: false,
      dependencies: true,
      end: true,
      progress: true,
    },
  },
];

const sampleTasksByType: Record<GanttChartType, GanttTask[]> = {
  project: [
    {
      id: "task-1",
      name: "요구사항 정리",
      start: "2026-04-20",
      end: "2026-04-24",
      progress: 80,
      owner: "PM",
    },
    {
      id: "task-2",
      name: "화면 구조 검토",
      start: "2026-04-23",
      end: "2026-04-29",
      progress: 45,
      owner: "UX",
    },
    {
      id: "task-3",
      name: "간트 MVP 구현",
      start: "2026-04-30",
      end: "2026-05-08",
      progress: 10,
      owner: "Dev",
    },
    {
      id: "task-4",
      name: "문서용 출력 확인",
      start: "2026-05-07",
      end: "2026-05-12",
      progress: 0,
      owner: "Ops",
    },
  ],
  milestones: [
    {
      id: "ms-kickoff",
      name: "프로젝트 킥오프",
      date: "2026-04-20",
      start: "2026-04-20",
      end: "2026-04-20",
      progress: 100,
      section: "기획",
      status: "done",
      dependsOn: [],
      owner: "PM",
      notes: "프로젝트 시작",
    },
    {
      id: "ms-scope",
      name: "범위 승인",
      date: "2026-04-24",
      start: "2026-04-24",
      end: "2026-04-24",
      progress: 100,
      section: "기획",
      status: "done",
      dependsOn: ["ms-kickoff"],
      owner: "PM",
      notes: "MVP 범위 확정",
    },
    {
      id: "ms-research",
      name: "사용자 조사 정리",
      date: "2026-04-28",
      start: "2026-04-28",
      end: "2026-04-28",
      progress: 100,
      section: "설계",
      status: "done",
      dependsOn: ["ms-kickoff"],
      owner: "UX",
      notes: "조사 결과 정리",
    },
    {
      id: "ms-schema",
      name: "입력 스키마 확정",
      date: "2026-05-02",
      start: "2026-05-02",
      end: "2026-05-02",
      progress: 100,
      section: "설계",
      status: "on-track",
      dependsOn: ["ms-scope", "ms-research"],
      owner: "UX",
      notes: "데이터 구조 확정",
    },
    {
      id: "ms-ui",
      name: "UI 시안 확정",
      date: "2026-05-07",
      start: "2026-05-07",
      end: "2026-05-07",
      progress: 100,
      section: "설계",
      status: "planned",
      dependsOn: ["ms-schema"],
      owner: "Designer",
      notes: "화면 시안 승인",
    },
    {
      id: "ms-dev-ready",
      name: "개발 준비 완료",
      date: "2026-05-13",
      start: "2026-05-13",
      end: "2026-05-13",
      progress: 100,
      section: "개발",
      status: "planned",
      dependsOn: ["ms-ui"],
      owner: "Dev Lead",
      notes: "구현 시작 가능",
    },
    {
      id: "ms-qa",
      name: "QA 시작",
      date: "2026-05-20",
      start: "2026-05-20",
      end: "2026-05-20",
      progress: 100,
      section: "검수",
      status: "planned",
      dependsOn: ["ms-dev-ready"],
      owner: "QA",
      notes: "QA 시작",
    },
    {
      id: "ms-release",
      name: "MVP 리뷰",
      date: "2026-05-27",
      start: "2026-05-27",
      end: "2026-05-27",
      progress: 100,
      section: "릴리즈",
      status: "planned",
      dependsOn: ["ms-qa"],
      owner: "PM",
      notes: "MVP 리뷰 및 피드백",
    },
  ],
  wbs: [
    {
      id: "wbs-plan",
      code: "1",
      name: "기획",
      parentId: "",
      nodeType: "group",
      start: "",
      end: "",
      progress: 0,
      owner: "PM",
      stage: "Discovery",
      dependsOn: [],
      notes: "상위 작업 그룹",
      open: true,
    },
    {
      id: "wbs-scenario",
      code: "1.1",
      name: "사용자 시나리오 정리",
      parentId: "wbs-plan",
      nodeType: "task",
      start: "2026-04-20",
      end: "2026-04-24",
      progress: 90,
      owner: "PM",
      stage: "Discovery",
      dependsOn: [],
      notes: "핵심 사용 흐름",
      open: true,
    },
    {
      id: "wbs-design",
      code: "2",
      name: "설계",
      parentId: "",
      nodeType: "group",
      start: "",
      end: "",
      progress: 0,
      owner: "UX",
      stage: "Design",
      dependsOn: [],
      notes: "화면과 입력 스키마",
      open: true,
    },
    {
      id: "wbs-schema",
      code: "2.1",
      name: "입력 스키마 정의",
      parentId: "wbs-design",
      nodeType: "task",
      start: "2026-04-24",
      end: "2026-04-30",
      progress: 60,
      owner: "UX",
      stage: "Design",
      dependsOn: ["wbs-scenario"],
      notes: "Milestone/WBS DSL",
      open: true,
    },
    {
      id: "wbs-schema-done",
      code: "2.2",
      name: "스키마 승인",
      parentId: "wbs-design",
      nodeType: "milestone",
      date: "2026-05-01",
      start: "2026-05-01",
      end: "2026-05-01",
      progress: 100,
      owner: "PM",
      stage: "Approval",
      dependsOn: ["wbs-schema"],
      notes: "개발 전 승인점",
      open: true,
    },
    {
      id: "wbs-build",
      code: "3",
      name: "구현",
      parentId: "",
      nodeType: "group",
      start: "",
      end: "",
      progress: 0,
      owner: "Dev",
      stage: "Build",
      dependsOn: [],
      notes: "adapter와 preview",
      open: true,
    },
    {
      id: "wbs-adapter",
      code: "3.1",
      name: "renderer adapter 구현",
      parentId: "wbs-build",
      nodeType: "task",
      start: "2026-05-04",
      end: "2026-05-10",
      progress: 35,
      owner: "Dev",
      stage: "Build",
      dependsOn: ["wbs-schema-done"],
      notes: "jsGantt/Mermaid 분리",
      open: true,
    },
  ],
};

export function getGanttChartTypeConfig(
  chartType: GanttChartType,
): GanttChartTypeConfig {
  return (
    ganttChartTypes.find((type) => type.id === chartType) ?? ganttChartTypes[0]
  );
}

export function getSampleTasksForChartType(
  chartType: GanttChartType,
): GanttTask[] {
  return sampleTasksByType[chartType].map((task) => ({
    ...task,
    dependsOn: task.dependsOn ? [...task.dependsOn] : undefined,
    dependencies: task.dependencies ? [...task.dependencies] : undefined,
  }));
}

export function createEmptyTaskForChartType(
  tasks: GanttTask[],
  chartType: GanttChartType,
  baseDate = getTodayDateString(),
): GanttTask {
  const id = createTaskId(tasks);

  if (chartType === "milestones") {
    return {
      id,
      name: "새 마일스톤",
      date: baseDate,
      start: baseDate,
      end: baseDate,
      progress: 100,
      section: "구간",
      status: "planned",
      dependsOn: [],
      owner: "",
      notes: "",
      critical: false,
      customClass: "milestone-marker",
    };
  }

  if (chartType === "wbs") {
    return {
      id,
      code: String(tasks.length + 1),
      name: "새 작업",
      parentId: "",
      nodeType: "task",
      start: baseDate,
      end: baseDate,
      date: baseDate,
      progress: 0,
      owner: "",
      stage: "",
      dependsOn: [],
      notes: "",
      open: true,
    };
  }

  return {
    id,
    name: "새 작업",
    start: baseDate,
    end: baseDate,
    progress: 0,
    owner: "",
  };
}

function getStatusSuffix(task: GanttTask): string {
  return task.status ? `-status-${task.status}` : "";
}

function getCustomClass(baseClass: string, task: GanttTask): string {
  return `${baseClass}${getStatusSuffix(task)}`;
}

function getOwnerSuffix(task: GanttTask): string {
  return task.owner ? ` · ${task.owner}` : "";
}

export function normalizeTaskForChartType(
  task: GanttTask,
  chartType: GanttChartType,
): GanttTask {
  if (chartType === "milestones") {
    const date = task.date || task.start;

    return {
      ...task,
      name: `${task.name}${getOwnerSuffix(task)}`,
      start: date,
      end: date,
      date,
      progress: 100,
      customClass: getCustomClass(
        task.critical ? "milestone-marker-critical" : "milestone-marker",
        task,
      ),
    };
  }

  if (chartType === "wbs") {
    const nodeType = task.nodeType ?? "task";
    const date = task.date || task.start;
    const labelPrefix = task.code ? `${task.code} ` : "";

    return {
      ...task,
      name: `${labelPrefix}${task.name}${getOwnerSuffix(task)}`,
      start: nodeType === "milestone" ? date : task.start,
      end: nodeType === "milestone" ? date : task.end,
      date,
      progress: nodeType === "milestone" ? 100 : task.progress,
      customClass:
        nodeType === "group"
          ? "wbs-group-row"
          : nodeType === "milestone"
            ? "wbs-milestone-row"
            : "wbs-task-row",
    };
  }

  return {
    ...task,
    name: `${task.name}${getOwnerSuffix(task)}`,
    customClass: "project-bar-color",
  };
}

export function getPreviewTasksForChartType(
  tasks: GanttTask[],
  chartType: GanttChartType,
): GanttTask[] {
  return tasks.map((task) => normalizeTaskForChartType(task, chartType));
}
