export type GanttViewMode = "Day" | "Week" | "Month" | "Quarter";
export type GanttDateUnit = "day" | "week" | "month" | "quarter";
export type GanttChartType =
  | "project"
  | "roadmap"
  | "milestones"
  | "progress"
  | "wbs";
export type GanttTaskStatus =
  | "planned"
  | "on-track"
  | "at-risk"
  | "blocked"
  | "done";
export type GanttTaskColor = string;
export type GanttBackgroundTemplate =
  | "clean"
  | "lined"
  | "document"
  | "contrast";

export type GanttTask = {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  phase?: string;
  owner?: string;
  status?: GanttTaskStatus;
  baselineStart?: string;
  baselineEnd?: string;
  color?: GanttTaskColor;
  customClass?: string;
  dependencies?: string[];
  previewSourceId?: string;
  previewDateTarget?: "actual" | "readonly";
};

export type GanttEditorShellState = {
  tasks: GanttTask[];
  chartType: GanttChartType;
  viewMode: GanttViewMode;
  timelineStart: string;
  timelineEnd: string;
  backgroundTemplate: GanttBackgroundTemplate;
  selectedTaskId?: string;
};

export type GanttTaskField =
  | "name"
  | "start"
  | "end"
  | "progress"
  | "phase"
  | "owner"
  | "status"
  | "baselineStart"
  | "baselineEnd"
  | "color"
  | "dependencies";

export type GanttValidationIssue = {
  taskId: string;
  field: GanttTaskField;
  message: string;
};

export type GanttDebugSnapshot = {
  taskCount: number;
  validTaskCount: number;
  issueCount: number;
  chartType: GanttChartType;
  viewMode: GanttViewMode;
  timelineStart: string;
  timelineEnd: string;
  backgroundTemplate: GanttBackgroundTemplate;
  selectedTaskId?: string;
  tasks: Array<{
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    phase?: string;
    owner?: string;
    status?: GanttTaskStatus;
    baselineStart?: string;
    baselineEnd?: string;
    color?: GanttTaskColor;
    dependencies?: string[];
  }>;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const colorPattern = /^#[0-9a-fA-F]{6}$/;

export const defaultGanttTaskColor = "#14745F";

export const ganttTaskStatusOptions: Array<{
  value: GanttTaskStatus;
  label: string;
}> = [
  { value: "planned", label: "계획" },
  { value: "on-track", label: "정상" },
  { value: "at-risk", label: "위험" },
  { value: "blocked", label: "차단" },
  { value: "done", label: "완료" },
];

export const ganttTaskColorOptions: Array<{
  value: GanttTaskColor;
  label: string;
  description: string;
}> = [
  { value: "#14745F", label: "에메랄드", description: "안정적인 일정" },
  { value: "#2F8F89", label: "틸", description: "협업 작업" },
  { value: "#2F6F9F", label: "블루", description: "검토 항목" },
  { value: "#4F6FAA", label: "인디고", description: "기술 작업" },
  { value: "#B7831D", label: "골드", description: "마감/주의" },
  { value: "#C75D4F", label: "코랄", description: "중요 일정" },
  { value: "#B45F7A", label: "로즈", description: "승인/검수" },
  { value: "#7A7F37", label: "올리브", description: "운영 작업" },
  { value: "#3F7D5F", label: "그린", description: "진행 작업" },
  { value: "#5A6A76", label: "스틸", description: "보조 일정" },
  { value: "#8A6F2A", label: "브론즈", description: "리스크" },
  { value: "#69736E", label: "그레이", description: "일반 항목" },
];

export const ganttBackgroundTemplateOptions: Array<{
  value: GanttBackgroundTemplate;
  label: string;
}> = [
  { value: "clean", label: "기본" },
  { value: "lined", label: "라인 강조" },
  { value: "document", label: "문서형" },
  { value: "contrast", label: "고대비" },
];

export type GanttDatePatchResult =
  | {
      applied: true;
      tasks: GanttTask[];
      start: string;
      end: string;
    }
  | {
      applied: false;
      tasks: GanttTask[];
      reason: "missing_task" | "invalid_date" | "end_before_start";
    };

export function getGanttTaskStatusLabel(status?: GanttTaskStatus): string {
  return (
    ganttTaskStatusOptions.find((option) => option.value === status)?.label ??
    "계획"
  );
}

export function createTaskId(tasks: GanttTask[]): string {
  const usedNumbers = tasks
    .map((task) => task.id.match(/^task-(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value));
  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

  return `task-${nextNumber}`;
}

export function createEmptyGanttTask(tasks: GanttTask[]): GanttTask {
  return {
    id: createTaskId(tasks),
    name: "새 작업",
    start: getTodayDateString(),
    end: getTodayDateString(),
    progress: 0,
  };
}

export function clampProgress(progress: number): number {
  if (Number.isNaN(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateForInput(new Date());
}

export function isValidDateObject(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

export function isValidDateInput(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime()) && formatDateForInput(date) === value;
}

export function isValidGanttTaskColor(value?: string): value is GanttTaskColor {
  return typeof value === "string" && colorPattern.test(value);
}

export function normalizeGanttTaskColor(value?: string): GanttTaskColor {
  if (!isValidGanttTaskColor(value)) {
    return defaultGanttTaskColor;
  }

  return `#${value.slice(1).toUpperCase()}`;
}

export function compareDateInputs(left: string, right: string): number {
  return (
    new Date(`${left}T00:00:00`).getTime() -
    new Date(`${right}T00:00:00`).getTime()
  );
}

export function updateGanttTask(
  tasks: GanttTask[],
  taskId: string,
  patch: Partial<GanttTask>,
): GanttTask[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...patch,
        }
      : task,
  );
}

export function addGanttTask(
  tasks: GanttTask[],
  task?: GanttTask,
): GanttTask[] {
  return [...tasks, task ?? createEmptyGanttTask(tasks)];
}

export function removeGanttTask(
  tasks: GanttTask[],
  taskId: string,
): GanttTask[] {
  return tasks.filter((task) => task.id !== taskId);
}

export function applyGanttDateChange(
  tasks: GanttTask[],
  taskId: string,
  start: Date,
  end: Date,
): GanttTask[] {
  return updateGanttTask(tasks, taskId, {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  });
}

export function applySafeGanttDatePatch(
  tasks: GanttTask[],
  taskId: string,
  start: string,
  end: string,
): GanttDatePatchResult {
  const hasTask = tasks.some((candidate) => candidate.id === taskId);

  if (!hasTask) {
    return { applied: false, tasks, reason: "missing_task" };
  }

  if (!isValidDateInput(start) || !isValidDateInput(end)) {
    return { applied: false, tasks, reason: "invalid_date" };
  }

  if (compareDateInputs(end, start) < 0) {
    return { applied: false, tasks, reason: "end_before_start" };
  }

  return {
    applied: true,
    tasks: updateGanttTask(tasks, taskId, { start, end }),
    start,
    end,
  };
}

export function applyGanttProgressChange(
  tasks: GanttTask[],
  taskId: string,
  progress: number,
): GanttTask[] {
  return updateGanttTask(tasks, taskId, { progress: clampProgress(progress) });
}

export function validateGanttTask(task: GanttTask): GanttValidationIssue[] {
  const issues: GanttValidationIssue[] = [];

  if (task.name.trim().length === 0) {
    issues.push({
      taskId: task.id,
      field: "name",
      message: "작업명을 입력하세요.",
    });
  }

  if (!isValidDateInput(task.start)) {
    issues.push({
      taskId: task.id,
      field: "start",
      message: "시작일은 YYYY-MM-DD 형식이어야 합니다.",
    });
  }

  if (!isValidDateInput(task.end)) {
    issues.push({
      taskId: task.id,
      field: "end",
      message: "종료일은 YYYY-MM-DD 형식이어야 합니다.",
    });
  }

  if (
    isValidDateInput(task.start) &&
    isValidDateInput(task.end) &&
    compareDateInputs(task.end, task.start) < 0
  ) {
    issues.push({
      taskId: task.id,
      field: "end",
      message: "종료일은 시작일보다 빠를 수 없습니다.",
    });
  }

  if (task.progress < 0 || task.progress > 100 || Number.isNaN(task.progress)) {
    issues.push({
      taskId: task.id,
      field: "progress",
      message: "진행률은 0부터 100 사이여야 합니다.",
    });
  }

  if (task.color && !isValidGanttTaskColor(task.color)) {
    issues.push({
      taskId: task.id,
      field: "color",
      message: "색상은 #RRGGBB 형식이어야 합니다.",
    });
  }

  if (task.baselineStart && !isValidDateInput(task.baselineStart)) {
    issues.push({
      taskId: task.id,
      field: "baselineStart",
      message: "계획 시작일은 YYYY-MM-DD 형식이어야 합니다.",
    });
  }

  if (task.baselineEnd && !isValidDateInput(task.baselineEnd)) {
    issues.push({
      taskId: task.id,
      field: "baselineEnd",
      message: "계획 종료일은 YYYY-MM-DD 형식이어야 합니다.",
    });
  }

  if (
    task.baselineStart &&
    task.baselineEnd &&
    isValidDateInput(task.baselineStart) &&
    isValidDateInput(task.baselineEnd) &&
    compareDateInputs(task.baselineEnd, task.baselineStart) < 0
  ) {
    issues.push({
      taskId: task.id,
      field: "baselineEnd",
      message: "계획 종료일은 계획 시작일보다 빠를 수 없습니다.",
    });
  }

  return issues;
}

export function validateGanttTasks(tasks: GanttTask[]): GanttValidationIssue[] {
  return tasks.flatMap(validateGanttTask);
}

export function getValidPreviewTasks(tasks: GanttTask[]): GanttTask[] {
  const issueTaskIds = new Set(
    validateGanttTasks(tasks).map((issue) => issue.taskId),
  );

  return tasks.filter((task) => !issueTaskIds.has(task.id));
}

export function createGanttDebugSnapshot(
  state: GanttEditorShellState,
): GanttDebugSnapshot {
  const issues = validateGanttTasks(state.tasks);
  const validTasks = getValidPreviewTasks(state.tasks);

  return {
    taskCount: state.tasks.length,
    validTaskCount: validTasks.length,
    issueCount: issues.length,
    chartType: state.chartType,
    viewMode: state.viewMode,
    timelineStart: state.timelineStart,
    timelineEnd: state.timelineEnd,
    backgroundTemplate: state.backgroundTemplate,
    selectedTaskId: state.selectedTaskId,
    tasks: state.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      start: task.start,
      end: task.end,
      progress: task.progress,
      phase: task.phase,
      owner: task.owner,
      status: task.status,
      baselineStart: task.baselineStart,
      baselineEnd: task.baselineEnd,
      color: task.color,
      dependencies: task.dependencies,
    })),
  };
}
