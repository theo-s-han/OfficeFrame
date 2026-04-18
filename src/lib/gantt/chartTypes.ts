import {
  createTaskId,
  getTodayDateString,
  type GanttChartType,
  type GanttTask,
  type GanttViewMode,
} from "./taskModel";
import {
  defaultWbsProjectName,
  defaultWbsStructureType,
} from "./wbsTree";

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
    name: "기본 일정형",
    shortName: "기본형",
    description:
      "작업 기간과 진행률을 가장 익숙한 간트 바 형태로 정리합니다.",
    editorTitle: "진행률 입력",
    editorHelp: "작업명, 담당자, 색상, 시작일, 종료일, 진행률을 입력합니다.",
    previewTitle: "기본 일정형 preview",
    previewHelp: "문서에 붙여넣기 좋은 실무형 간트 차트입니다.",
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
    description:
      "승인, 리뷰, 릴리즈 같은 주요 시점을 문서형 타임라인으로 정리합니다.",
    editorTitle: "마일스톤 입력",
    editorHelp:
      "이름, 날짜, 섹션, 이전 단계만 정하면 주요 시점 흐름을 빠르게 만들 수 있습니다.",
    previewTitle: "마일스톤 타임라인",
    previewHelp:
      "섹션별 주요 시점을 Timeline preview 1개로 깔끔하게 보여줍니다.",
    defaultViewMode: "Week",
    taskNameLabel: "Name",
    startLabel: "Date",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "Section",
    ownerLabel: "Owner",
    statusLabel: "Status",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "이전 단계",
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
    name: "WBS Tree",
    shortName: "WBS",
    description: "프로젝트 구조를 계층형 WBS Tree로 정리합니다.",
    editorTitle: "WBS Tree 입력",
    editorHelp:
      "프로젝트명, 구조 유형, 상위 항목을 기준으로 계층 구조를 만들고 문서형 WBS Tree를 완성합니다.",
    previewTitle: "WBS Tree preview",
    previewHelp: "WBS 코드가 자동 생성된 단일 트리 결과물을 확인합니다.",
    defaultViewMode: "Week",
    taskNameLabel: "항목명",
    startLabel: "Start",
    endLabel: "End",
    progressLabel: "Progress",
    phaseLabel: "구조 유형",
    ownerLabel: "담당자",
    statusLabel: "상태",
    baselineStartLabel: "Baseline start",
    baselineEndLabel: "Baseline end",
    dependenciesLabel: "상위 항목",
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
];

const sampleTasksByType: Record<GanttChartType, GanttTask[]> = {
  project: [
    {
      id: "task-1",
      name: "요구사항 정리",
      start: "2026-04-17",
      end: "2026-05-24",
      progress: 80,
      owner: "PM",
      color: "#4E8B63",
    },
    {
      id: "task-2",
      name: "화면 구조 검토",
      start: "2026-05-23",
      end: "2026-06-29",
      progress: 45,
      owner: "UX",
      color: "#A07A2E",
    },
    {
      id: "task-3",
      name: "간트 MVP 구현",
      start: "2026-06-30",
      end: "2026-07-08",
      progress: 10,
      owner: "Dev",
      color: "#A65D7B",
    },
    {
      id: "task-4",
      name: "문서용 출력 확인",
      start: "2026-07-07",
      end: "2026-08-15",
      progress: 0,
      owner: "Ops",
      color: "#7A68B8",
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
      date: "2026-04-27",
      start: "2026-04-27",
      end: "2026-04-27",
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
      date: "2026-05-04",
      start: "2026-05-04",
      end: "2026-05-04",
      progress: 100,
      section: "설계",
      status: "done",
      dependsOn: ["ms-scope"],
      owner: "UX",
      notes: "조사 결과 정리",
    },
    {
      id: "ms-schema",
      name: "입력 스키마 확정",
      date: "2026-05-12",
      start: "2026-05-12",
      end: "2026-05-12",
      progress: 100,
      section: "설계",
      status: "on-track",
      dependsOn: ["ms-research"],
      owner: "UX",
      notes: "데이터 구조 확정",
    },
    {
      id: "ms-ui",
      name: "UI 시안 확정",
      date: "2026-05-19",
      start: "2026-05-19",
      end: "2026-05-19",
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
      date: "2026-05-27",
      start: "2026-05-27",
      end: "2026-05-27",
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
      date: "2026-06-03",
      start: "2026-06-03",
      end: "2026-06-03",
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
      date: "2026-06-10",
      start: "2026-06-10",
      end: "2026-06-10",
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
      id: "wbs-discovery",
      name: "요구 분석",
      parentId: "",
      start: "",
      end: "",
      progress: 0,
      owner: "PM",
      status: "in-progress",
      notes: "프로젝트 목표와 주요 사용 사례를 정리합니다.",
    },
    {
      id: "wbs-interview",
      name: "이해관계자 인터뷰 요약",
      parentId: "wbs-discovery",
      start: "",
      end: "",
      progress: 0,
      owner: "PM",
      status: "done",
      notes: "부서별 요구사항 수집 완료",
    },
    {
      id: "wbs-requirement-doc",
      name: "요구사항 문서 초안",
      parentId: "wbs-discovery",
      start: "",
      end: "",
      progress: 0,
      owner: "PM",
      status: "in-progress",
      notes: "MVP 범위를 문서로 정리",
    },
    {
      id: "wbs-structure",
      name: "정보 구조 설계",
      parentId: "",
      start: "",
      end: "",
      progress: 0,
      owner: "UX",
      status: "in-progress",
      notes: "화면 흐름과 구조를 계층으로 나눕니다.",
    },
    {
      id: "wbs-screen-map",
      name: "화면 맵 정리",
      parentId: "wbs-structure",
      start: "",
      end: "",
      progress: 0,
      owner: "UX",
      status: "done",
      notes: "주요 화면과 이동 경로 확정",
    },
    {
      id: "wbs-editor-flow",
      name: "편집기 흐름 설계",
      parentId: "wbs-structure",
      start: "",
      end: "",
      progress: 0,
      owner: "UX",
      status: "in-progress",
      notes: "입력, preview, export 흐름 연결",
    },
    {
      id: "wbs-build",
      name: "구현 준비",
      parentId: "",
      start: "",
      end: "",
      progress: 0,
      owner: "Dev Lead",
      status: "not-started",
      notes: "개발용 공통 규칙과 품질 기준을 정리합니다.",
    },
    {
      id: "wbs-theme",
      name: "테마 토큰 정리",
      parentId: "wbs-build",
      start: "",
      end: "",
      progress: 0,
      owner: "Dev",
      status: "not-started",
      notes: "문서형 색상 체계를 재사용 가능한 토큰으로 정리",
    },
    {
      id: "wbs-export",
      name: "PNG export 확인",
      parentId: "wbs-build",
      start: "",
      end: "",
      progress: 0,
      owner: "Ops",
      status: "not-started",
      notes: "preview와 동일한 결과물을 저장하도록 검증",
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
      section: "기획",
      status: "planned",
      dependsOn: [],
      owner: "",
      notes: "",
      customClass: "milestone-marker",
    };
  }

  if (chartType === "wbs") {
    return {
      id,
      name: "새 항목",
      parentId: "",
      start: "",
      end: "",
      progress: 0,
      owner: "",
      status: "not-started",
      notes: "",
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

export function getDefaultWbsProjectName() {
  return defaultWbsProjectName;
}

export function getDefaultWbsStructureType() {
  return defaultWbsStructureType;
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
    return {
      ...task,
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

