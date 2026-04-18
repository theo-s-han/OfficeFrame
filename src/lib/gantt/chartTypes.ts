import {
  createTaskId,
  defaultGanttTaskColor,
  getGanttTaskStatusLabel,
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
    id: "roadmap",
    name: "로드맵형",
    shortName: "로드맵",
    description: "분기/월 단위의 큰 흐름과 영역을 보여줍니다.",
    editorTitle: "로드맵 항목",
    editorHelp: "영역과 항목 기간을 입력해 큰 흐름을 만듭니다.",
    previewTitle: "로드맵형 preview",
    previewHelp: "상세 task보다 주요 흐름을 강조합니다.",
    defaultViewMode: "Month",
    taskNameLabel: "Item",
    startLabel: "Start",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "영역",
    ownerLabel: "Owner",
    statusLabel: "상태",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "Depends on",
    fields: {
      phase: true,
      owner: true,
      status: true,
      baseline: false,
      dependencies: false,
      end: true,
      progress: false,
    },
  },
  {
    id: "milestones",
    name: "마일스톤형",
    shortName: "마일스톤",
    description: "승인, 릴리스, 마감 같은 주요 시점만 간결하게 표시합니다.",
    editorTitle: "마일스톤 입력",
    editorHelp: "마일스톤 이름과 날짜만 입력합니다.",
    previewTitle: "마일스톤형 preview",
    previewHelp: "주요 날짜를 짧은 표식으로 정리합니다.",
    defaultViewMode: "Month",
    taskNameLabel: "Milestone",
    startLabel: "Date",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "Phase",
    ownerLabel: "Owner",
    statusLabel: "상태",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "Depends on",
    fields: {
      phase: false,
      owner: true,
      status: true,
      baseline: false,
      dependencies: false,
      end: false,
      progress: false,
    },
  },
  {
    id: "progress",
    name: "진행률 추적형",
    shortName: "진행률",
    description: "현재 진행률과 예상 진행률을 함께 확인합니다.",
    editorTitle: "진행률 입력",
    editorHelp: "진행률을 중심으로 현재 상태를 점검합니다.",
    previewTitle: "진행률 추적형 preview",
    previewHelp: "현재 진행률과 예상 진행률을 함께 보여줍니다.",
    defaultViewMode: "Week",
    taskNameLabel: "Task",
    startLabel: "Start",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "Phase",
    ownerLabel: "Owner",
    statusLabel: "상태",
    baselineStartLabel: "계획 시작",
    baselineEndLabel: "계획 종료",
    dependenciesLabel: "Depends on",
    fields: {
      phase: false,
      owner: true,
      status: true,
      baseline: true,
      dependencies: false,
      end: true,
      progress: true,
    },
  },
  {
    id: "wbs",
    name: "WBS/단계형",
    shortName: "WBS",
    description: "단계와 작업을 함께 보여줘 프로젝트 구조를 설명합니다.",
    editorTitle: "WBS 작업 입력",
    editorHelp: "단계와 작업을 함께 입력해 구조를 드러냅니다.",
    previewTitle: "WBS/단계형 preview",
    previewHelp: "작업 이름 앞에 단계가 붙어 구조가 보입니다.",
    defaultViewMode: "Week",
    taskNameLabel: "Work package",
    startLabel: "Start",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "단계",
    ownerLabel: "Owner",
    statusLabel: "Status",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "선행 작업",
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
      color: "#14745F",
    },
    {
      id: "task-2",
      name: "화면 구조 검토",
      start: "2026-04-23",
      end: "2026-04-29",
      progress: 45,
      owner: "UX",
      color: "#2F8F89",
    },
    {
      id: "task-3",
      name: "간트 MVP 구현",
      start: "2026-04-30",
      end: "2026-05-08",
      progress: 10,
      owner: "Dev",
      color: "#B7831D",
    },
    {
      id: "task-4",
      name: "문서용 출력 확인",
      start: "2026-05-07",
      end: "2026-05-12",
      progress: 0,
      owner: "Ops",
      color: "#C75D4F",
    },
  ],
  roadmap: [
    {
      id: "roadmap-1",
      name: "핵심 입력 흐름",
      phase: "Editor",
      start: "2026-04-01",
      end: "2026-05-15",
      progress: 0,
      owner: "Product",
      status: "on-track",
    },
    {
      id: "roadmap-2",
      name: "문서용 출력",
      phase: "Export",
      start: "2026-05-01",
      end: "2026-06-20",
      progress: 0,
      owner: "Dev",
      status: "at-risk",
    },
    {
      id: "roadmap-3",
      name: "차트 타입 확장",
      phase: "Templates",
      start: "2026-06-01",
      end: "2026-07-31",
      progress: 0,
      owner: "PM",
      status: "planned",
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      name: "범위 승인",
      start: "2026-04-20",
      end: "2026-04-20",
      progress: 100,
      owner: "PM",
      status: "done",
      customClass: "milestone-marker",
    },
    {
      id: "milestone-2",
      name: "MVP 리뷰",
      start: "2026-05-08",
      end: "2026-05-08",
      progress: 100,
      owner: "Dev lead",
      status: "on-track",
      customClass: "milestone-marker",
    },
    {
      id: "milestone-3",
      name: "문서 배포",
      start: "2026-05-20",
      end: "2026-05-20",
      progress: 100,
      owner: "Ops",
      status: "planned",
      customClass: "milestone-marker",
    },
  ],
  progress: [
    {
      id: "progress-1",
      name: "기획 확정",
      start: "2026-04-18",
      end: "2026-04-25",
      progress: 100,
      owner: "PM",
      status: "done",
      baselineStart: "2026-04-18",
      baselineEnd: "2026-04-24",
    },
    {
      id: "progress-2",
      name: "렌더링 연결",
      start: "2026-04-24",
      end: "2026-05-03",
      progress: 65,
      owner: "Dev",
      status: "on-track",
      baselineStart: "2026-04-22",
      baselineEnd: "2026-05-01",
    },
    {
      id: "progress-3",
      name: "PNG 품질 확인",
      start: "2026-05-01",
      end: "2026-05-12",
      progress: 25,
      owner: "QA",
      status: "at-risk",
      baselineStart: "2026-05-01",
      baselineEnd: "2026-05-09",
    },
  ],
  wbs: [
    {
      id: "wbs-1",
      phase: "1. 기획",
      name: "사용자 시나리오 정리",
      start: "2026-04-20",
      end: "2026-04-24",
      progress: 90,
      owner: "PM",
    },
    {
      id: "wbs-2",
      phase: "2. 설계",
      name: "입력 스키마 정의",
      start: "2026-04-24",
      end: "2026-04-30",
      progress: 60,
      owner: "UX",
    },
    {
      id: "wbs-3",
      phase: "3. 구현",
      name: "타입별 preview 구현",
      start: "2026-05-01",
      end: "2026-05-10",
      progress: 35,
      owner: "Dev",
      dependencies: ["wbs-2"],
    },
    {
      id: "wbs-4",
      phase: "4. 검증",
      name: "문서용 PNG 확인",
      start: "2026-05-11",
      end: "2026-05-15",
      progress: 0,
      owner: "QA",
      dependencies: ["wbs-3"],
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
      start: baseDate,
      end: baseDate,
      progress: 100,
      owner: "",
      status: "planned",
      customClass: "milestone-marker",
    };
  }

  if (chartType === "roadmap") {
    return {
      id,
      name: "새 로드맵 항목",
      phase: "영역",
      start: baseDate,
      end: baseDate,
      progress: 0,
      owner: "",
      status: "planned",
    };
  }

  if (chartType === "progress") {
    return {
      id,
      name: "새 추적 작업",
      start: baseDate,
      end: baseDate,
      progress: 0,
      owner: "",
      status: "planned",
      baselineStart: baseDate,
      baselineEnd: baseDate,
    };
  }

  if (chartType === "wbs") {
    return {
      id,
      name: "새 작업 패키지",
      phase: "단계",
      start: baseDate,
      end: baseDate,
      progress: 0,
      owner: "",
      dependencies: [],
    };
  }

  return {
    id,
    name: "새 작업",
    start: baseDate,
    end: baseDate,
    progress: 0,
    owner: "",
    color: defaultGanttTaskColor,
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
    return {
      ...task,
      name: `${task.name}${getOwnerSuffix(task)}`,
      end: task.start,
      progress: 100,
      customClass: getCustomClass("milestone-marker", task),
    };
  }

  if (chartType === "roadmap") {
    const statusLabel = task.status
      ? ` (${getGanttTaskStatusLabel(task.status)})`
      : "";

    return {
      ...task,
      name: task.phase
        ? `${task.phase}: ${task.name}${statusLabel}${getOwnerSuffix(task)}`
        : `${task.name}${statusLabel}${getOwnerSuffix(task)}`,
      progress: 0,
      customClass: getCustomClass("roadmap-bar", task),
    };
  }

  if (chartType === "progress") {
    return {
      ...task,
      name: `실제: ${task.name}${getOwnerSuffix(task)}`,
      customClass: getCustomClass("progress-tracking-bar", task),
    };
  }

  if (chartType === "wbs") {
    return {
      ...task,
      name: task.phase
        ? `${task.phase} / ${task.name}${getOwnerSuffix(task)}`
        : `${task.name}${getOwnerSuffix(task)}`,
      customClass: "wbs-bar",
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
  if (chartType !== "progress") {
    return tasks.map((task) => normalizeTaskForChartType(task, chartType));
  }

  return tasks.flatMap((task) => {
    const actualTask = normalizeTaskForChartType(task, chartType);

    if (!task.baselineStart || !task.baselineEnd) {
      return [actualTask];
    }

    return [
      {
        ...task,
        id: `${task.id}-baseline`,
        name: `계획: ${task.name}${getOwnerSuffix(task)}`,
        start: task.baselineStart,
        end: task.baselineEnd,
        progress: 0,
        dependencies: [],
        previewSourceId: task.id,
        previewDateTarget: "readonly",
        customClass: "baseline-bar",
      },
      actualTask,
    ];
  });
}
