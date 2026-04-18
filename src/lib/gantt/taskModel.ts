import { defaultGanttPalette } from "./theme";

export type GanttViewMode = "Day" | "Week" | "Month" | "Quarter";
export type GanttDateUnit = "day" | "week" | "month" | "quarter";
export type GanttChartType = "project" | "milestones" | "wbs";
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
export type WbsNodeType = "group" | "task" | "milestone";

export type GanttTask = {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  date?: string;
  section?: string;
  phase?: string;
  owner?: string;
  status?: GanttTaskStatus;
  baselineStart?: string;
  baselineEnd?: string;
  color?: GanttTaskColor;
  code?: string;
  parentId?: string;
  nodeType?: WbsNodeType;
  stage?: string;
  dependsOn?: string[];
  notes?: string;
  critical?: boolean;
  open?: boolean;
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
  | "id"
  | "name"
  | "start"
  | "end"
  | "date"
  | "progress"
  | "section"
  | "phase"
  | "owner"
  | "status"
  | "baselineStart"
  | "baselineEnd"
  | "color"
  | "code"
  | "parentId"
  | "nodeType"
  | "stage"
  | "dependsOn"
  | "notes"
  | "critical"
  | "open"
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
    date?: string;
    section?: string;
    phase?: string;
    owner?: string;
    status?: GanttTaskStatus;
    baselineStart?: string;
    baselineEnd?: string;
    color?: GanttTaskColor;
    code?: string;
    parentId?: string;
    nodeType?: WbsNodeType;
    stage?: string;
    dependsOn?: string[];
    notes?: string;
    critical?: boolean;
    open?: boolean;
    dependencies?: string[];
  }>;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const colorPattern = /^#[0-9a-fA-F]{6}$/;

export const defaultGanttTaskColor = defaultGanttPalette.taskColors[0];

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

export const milestoneTaskStatusOptions = ganttTaskStatusOptions.filter(
  (option) =>
    option.value === "planned" ||
    option.value === "on-track" ||
    option.value === "done",
);

export const ganttTaskColorOptions: Array<{
  value: GanttTaskColor;
  label: string;
  description: string;
}> = [
  { value: "#5B6EE1", label: "Indigo Blue", description: "핵심 일정" },
  { value: "#2F7E9E", label: "Teal Blue", description: "기획/분석" },
  { value: "#4E8B63", label: "Muted Green", description: "운영 안정" },
  { value: "#A07A2E", label: "Soft Ochre", description: "검토/주의" },
  { value: "#A65D7B", label: "Dusty Rose", description: "승인/의사결정" },
  { value: "#7A68B8", label: "Soft Violet", description: "기술/지원" },
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

export const wbsNodeTypeOptions: Array<{
  value: WbsNodeType;
  label: string;
}> = [
  { value: "group", label: "Group" },
  { value: "task", label: "Task" },
  { value: "milestone", label: "Milestone" },
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

export function parseDependencyInput(value: string, currentTaskId?: string) {
  return value
    .split(",")
    .map((dependency) => dependency.trim())
    .filter(
      (dependency) =>
        dependency.length > 0 &&
        (!currentTaskId || dependency !== currentTaskId),
    );
}

export function getTaskDependencyIds(task: GanttTask): string[] {
  return task.dependsOn ?? task.dependencies ?? [];
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

export function updateGanttTaskId(
  tasks: GanttTask[],
  previousId: string,
  nextId: string,
): GanttTask[] {
  return tasks.map((task) => {
    if (task.id === previousId) {
      return { ...task, id: nextId };
    }

    return {
      ...task,
      parentId: task.parentId === previousId ? nextId : task.parentId,
      dependsOn: task.dependsOn?.map((id) => (id === previousId ? nextId : id)),
      dependencies: task.dependencies?.map((id) =>
        id === previousId ? nextId : id,
      ),
    };
  });
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
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) => ({
      ...task,
      parentId: task.parentId === taskId ? "" : task.parentId,
      dependsOn: task.dependsOn?.filter(
        (dependencyId) => dependencyId !== taskId,
      ),
      dependencies: task.dependencies?.filter(
        (dependencyId) => dependencyId !== taskId,
      ),
    }));
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

function createIssue(
  task: GanttTask,
  field: GanttTaskField,
  message: string,
): GanttValidationIssue {
  return {
    taskId: task.id,
    field,
    message,
  };
}

function validateCommonTaskIdentity(task: GanttTask): GanttValidationIssue[] {
  const issues: GanttValidationIssue[] = [];

  if (task.id.trim().length === 0) {
    issues.push(createIssue(task, "id", "id를 입력하세요."));
  }

  if (task.name.trim().length === 0) {
    issues.push(createIssue(task, "name", "이름을 입력하세요."));
  }

  return issues;
}

function validateProjectTask(task: GanttTask): GanttValidationIssue[] {
  const issues = validateCommonTaskIdentity(task);

  if (!isValidDateInput(task.start)) {
    issues.push(
      createIssue(task, "start", "시작일은 YYYY-MM-DD 형식이어야 합니다."),
    );
  }

  if (!isValidDateInput(task.end)) {
    issues.push(
      createIssue(task, "end", "종료일은 YYYY-MM-DD 형식이어야 합니다."),
    );
  }

  if (
    isValidDateInput(task.start) &&
    isValidDateInput(task.end) &&
    compareDateInputs(task.end, task.start) < 0
  ) {
    issues.push(
      createIssue(task, "end", "종료일은 시작일보다 빠를 수 없습니다."),
    );
  }

  if (task.progress < 0 || task.progress > 100 || Number.isNaN(task.progress)) {
    issues.push(
      createIssue(task, "progress", "진행률은 0부터 100 사이여야 합니다."),
    );
  }

  if (task.color && !isValidGanttTaskColor(task.color)) {
    issues.push(
      createIssue(task, "color", "색상은 #RRGGBB 형식이어야 합니다."),
    );
  }

  if (task.baselineStart && !isValidDateInput(task.baselineStart)) {
    issues.push(
      createIssue(
        task,
        "baselineStart",
        "계획 시작일은 YYYY-MM-DD 형식이어야 합니다.",
      ),
    );
  }

  if (task.baselineEnd && !isValidDateInput(task.baselineEnd)) {
    issues.push(
      createIssue(
        task,
        "baselineEnd",
        "계획 종료일은 YYYY-MM-DD 형식이어야 합니다.",
      ),
    );
  }

  if (
    task.baselineStart &&
    task.baselineEnd &&
    isValidDateInput(task.baselineStart) &&
    isValidDateInput(task.baselineEnd) &&
    compareDateInputs(task.baselineEnd, task.baselineStart) < 0
  ) {
    issues.push(
      createIssue(
        task,
        "baselineEnd",
        "계획 종료일은 계획 시작일보다 빠를 수 없습니다.",
      ),
    );
  }

  return issues;
}

function validateMilestoneTask(task: GanttTask): GanttValidationIssue[] {
  const issues = validateCommonTaskIdentity(task);

  if (!task.date || !isValidDateInput(task.date)) {
    issues.push(
      createIssue(
        task,
        "date",
        "마일스톤 날짜는 YYYY-MM-DD 하루 단위 날짜여야 합니다.",
      ),
    );
  }

  if (
    task.status &&
    !milestoneTaskStatusOptions.some((option) => option.value === task.status)
  ) {
    issues.push(
      createIssue(
        task,
        "status",
        "마일스톤 상태는 planned, on-track, done만 사용할 수 있습니다.",
      ),
    );
  }

  return issues;
}

function validateWbsTask(task: GanttTask): GanttValidationIssue[] {
  const issues = validateCommonTaskIdentity(task);
  const nodeType = task.nodeType ?? "task";

  if (!["group", "task", "milestone"].includes(nodeType)) {
    issues.push(
      createIssue(
        task,
        "nodeType",
        "nodeType은 group/task/milestone이어야 합니다.",
      ),
    );
  }

  if (nodeType === "task") {
    if (!isValidDateInput(task.start)) {
      issues.push(
        createIssue(task, "start", "leaf task는 시작일이 필요합니다."),
      );
    }

    if (!isValidDateInput(task.end)) {
      issues.push(createIssue(task, "end", "leaf task는 종료일이 필요합니다."));
    }

    if (
      isValidDateInput(task.start) &&
      isValidDateInput(task.end) &&
      compareDateInputs(task.end, task.start) < 0
    ) {
      issues.push(
        createIssue(task, "end", "종료일은 시작일보다 빠를 수 없습니다."),
      );
    }

    if (
      task.progress < 0 ||
      task.progress > 100 ||
      Number.isNaN(task.progress)
    ) {
      issues.push(
        createIssue(task, "progress", "진행률은 0부터 100 사이여야 합니다."),
      );
    }
  }

  if (
    nodeType === "milestone" &&
    (!task.date || !isValidDateInput(task.date))
  ) {
    issues.push(createIssue(task, "date", "milestone은 date가 필요합니다."));
  }

  return issues;
}

function findDuplicateValues<T extends string>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();

  values.forEach((value) => {
    if (!value) {
      return;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return new Map([...counts].filter(([, count]) => count > 1));
}

function findDependencyCycleTaskIds(tasks: GanttTask[]): Set<string> {
  const graph = new Map(
    tasks.map((task) => [
      task.id,
      getTaskDependencyIds(task).filter(
        (dependencyId) =>
          dependencyId !== task.id &&
          tasks.some((candidate) => candidate.id === dependencyId),
      ),
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleTaskIds = new Set<string>();

  function visit(taskId: string, path: string[]): boolean {
    if (visiting.has(taskId)) {
      const cycleStartIndex = path.indexOf(taskId);
      path.slice(cycleStartIndex).forEach((id) => cycleTaskIds.add(id));
      cycleTaskIds.add(taskId);
      return true;
    }

    if (visited.has(taskId)) {
      return false;
    }

    visiting.add(taskId);

    for (const dependencyId of graph.get(taskId) ?? []) {
      visit(dependencyId, [...path, dependencyId]);
    }

    visiting.delete(taskId);
    visited.add(taskId);

    return cycleTaskIds.has(taskId);
  }

  graph.forEach((_, taskId) => visit(taskId, [taskId]));

  return cycleTaskIds;
}

function validateTaskCollection(
  tasks: GanttTask[],
  chartType: GanttChartType,
): GanttValidationIssue[] {
  const issues: GanttValidationIssue[] = [];
  const duplicateIds = findDuplicateValues(tasks.map((task) => task.id.trim()));

  if (chartType === "milestones" || chartType === "wbs") {
    tasks.forEach((task) => {
      if (duplicateIds.has(task.id.trim())) {
        issues.push(createIssue(task, "id", "id는 중복될 수 없습니다."));
      }
    });
  }

  if (chartType === "wbs") {
    const ids = new Set(tasks.map((task) => task.id));
    const duplicateCodes = findDuplicateValues(
      tasks.map((task) => task.code?.trim() ?? "").filter(Boolean),
    );

    tasks.forEach((task) => {
      if (task.parentId && !ids.has(task.parentId)) {
        issues.push(
          createIssue(task, "parentId", "존재하는 parentId를 선택하세요."),
        );
      }

      if (task.code && duplicateCodes.has(task.code.trim())) {
        issues.push(createIssue(task, "code", "code는 중복될 수 없습니다."));
      }
    });
  }

  if (chartType === "milestones" || chartType === "wbs") {
    const ids = new Set(tasks.map((task) => task.id));
    const cycleTaskIds = findDependencyCycleTaskIds(tasks);

    tasks.forEach((task) => {
      getTaskDependencyIds(task).forEach((dependencyId) => {
        if (dependencyId === task.id) {
          issues.push(
            createIssue(
              task,
              "dependsOn",
              "자기 자신을 dependsOn으로 참조할 수 없습니다.",
            ),
          );
          return;
        }

        if (!ids.has(dependencyId)) {
          issues.push(
            createIssue(task, "dependsOn", "존재하지 않는 의존성 ID입니다."),
          );
        }
      });

      if (cycleTaskIds.has(task.id)) {
        issues.push(
          createIssue(task, "dependsOn", "순환 의존성은 허용되지 않습니다."),
        );
      }
    });
  }

  return issues;
}

export function validateGanttTask(
  task: GanttTask,
  chartType: GanttChartType = "project",
): GanttValidationIssue[] {
  if (chartType === "milestones") {
    return validateMilestoneTask(task);
  }

  if (chartType === "wbs") {
    return validateWbsTask(task);
  }

  return validateProjectTask(task);
}

export function validateGanttTasks(
  tasks: GanttTask[],
  chartType: GanttChartType = "project",
): GanttValidationIssue[] {
  return [
    ...tasks.flatMap((task) => validateGanttTask(task, chartType)),
    ...validateTaskCollection(tasks, chartType),
  ];
}

export function getValidPreviewTasks(
  tasks: GanttTask[],
  chartType: GanttChartType = "project",
): GanttTask[] {
  const issueTaskIds = new Set(
    validateGanttTasks(tasks, chartType).map((issue) => issue.taskId),
  );

  return tasks.filter((task) => !issueTaskIds.has(task.id));
}

export function createGanttDebugSnapshot(
  state: GanttEditorShellState,
): GanttDebugSnapshot {
  const issues = validateGanttTasks(state.tasks, state.chartType);
  const validTasks = getValidPreviewTasks(state.tasks, state.chartType);

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
      date: task.date,
      section: task.section,
      phase: task.phase,
      owner: task.owner,
      status: task.status,
      baselineStart: task.baselineStart,
      baselineEnd: task.baselineEnd,
      color: task.color,
      code: task.code,
      parentId: task.parentId,
      nodeType: task.nodeType,
      stage: task.stage,
      dependsOn: task.dependsOn,
      notes: task.notes,
      critical: task.critical,
      open: task.open,
      dependencies: task.dependencies,
    })),
  };
}
