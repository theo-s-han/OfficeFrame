import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidDateInput,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";

export type TimelineMode = "horizontal" | "alternating" | "vertical";
export type TimelineStatus = "planned" | "active" | "done";

export type TimelineItem = {
  color?: string;
  date: string;
  id: string;
  name: string;
  notes?: string;
  order: number;
  owner?: string;
  section?: string;
  status?: TimelineStatus;
};

export type TimelineState = {
  items: TimelineItem[];
  mode: TimelineMode;
  selectedItemId?: string;
  title: string;
};

export type TimelineValidationIssue = {
  field: "name" | "date" | "color" | "status";
  itemId: string;
  message: string;
};

export const timelineModeOptions: Array<{
  label: string;
  value: TimelineMode;
}> = [
  { value: "horizontal", label: "가로" },
  { value: "alternating", label: "교차" },
  { value: "vertical", label: "세로" },
];

export const timelineStatusOptions: Array<{
  label: string;
  value: TimelineStatus;
}> = [
  { value: "planned", label: "계획" },
  { value: "active", label: "진행" },
  { value: "done", label: "완료" },
];

function createTimelineId(items: TimelineItem[]) {
  const nextNumber =
    items.reduce((maxValue, item) => {
      const matched = item.id.match(/^timeline-(\d+)$/);

      return matched ? Math.max(maxValue, Number(matched[1])) : maxValue;
    }, 0) + 1;

  return `timeline-${nextNumber}`;
}

function getSuggestedTimelineColor(index: number) {
  return (
    ganttTaskColorOptions[index % ganttTaskColorOptions.length]?.value ??
    defaultGanttTaskColor
  );
}

export function createEmptyTimelineItem(items: TimelineItem[]): TimelineItem {
  return {
    id: createTimelineId(items),
    name: "새 이벤트",
    date: "2026-04-21",
    section: "기본 섹션",
    status: "planned",
    owner: "",
    notes: "",
    color: getSuggestedTimelineColor(items.length),
    order: items.length,
  };
}

export function createSampleTimelineState(): TimelineState {
  const items: TimelineItem[] = [
    {
      id: "timeline-1",
      name: "프로젝트 킥오프",
      date: "2026-04-18",
      section: "기획",
      status: "done",
      owner: "PM",
      notes: "목표와 일정 원칙을 확정합니다.",
      color: "#5B6EE1",
      order: 0,
    },
    {
      id: "timeline-2",
      name: "요구사항 구조화",
      date: "2026-04-24",
      section: "기획",
      status: "done",
      owner: "Planner",
      notes: "입력/출력 필드를 정리합니다.",
      color: "#2F7E9E",
      order: 1,
    },
    {
      id: "timeline-3",
      name: "프리뷰 시안 확정",
      date: "2026-04-30",
      section: "디자인",
      status: "active",
      owner: "Designer",
      notes: "문서형 레이아웃과 색 체계를 정합니다.",
      color: "#4E8B63",
      order: 2,
    },
    {
      id: "timeline-4",
      name: "조직도 구현 시작",
      date: "2026-05-05",
      section: "개발",
      status: "active",
      owner: "Frontend",
      notes: "단일 preview와 PNG export 기준을 반영합니다.",
      color: "#A07A2E",
      order: 3,
    },
    {
      id: "timeline-5",
      name: "플로우차트 구현",
      date: "2026-05-11",
      section: "개발",
      status: "planned",
      owner: "Frontend",
      notes: "노드/연결 validation을 적용합니다.",
      color: "#A65D7B",
      order: 4,
    },
    {
      id: "timeline-6",
      name: "타임라인 정리",
      date: "2026-05-18",
      section: "개발",
      status: "planned",
      owner: "Dev Lead",
      notes: "event timeline과 문서형 카드를 정리합니다.",
      color: "#7A68B8",
      order: 5,
    },
    {
      id: "timeline-7",
      name: "문서/PPT 검토",
      date: "2026-05-26",
      section: "검수",
      status: "planned",
      owner: "Ops",
      notes: "export 결과 비율과 여백을 점검합니다.",
      color: "#5B6EE1",
      order: 6,
    },
  ];

  return {
    title: "타임라인",
    mode: "alternating",
    items,
    selectedItemId: items[0]?.id,
  };
}

export function addTimelineItem(items: TimelineItem[]) {
  return [...items, createEmptyTimelineItem(items)];
}

export function updateTimelineItem(
  items: TimelineItem[],
  itemId: string,
  patch: Partial<TimelineItem>,
) {
  return items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          ...patch,
        }
      : item,
  );
}

export function removeTimelineItem(items: TimelineItem[], itemId: string) {
  return items.filter((item) => item.id !== itemId);
}

export function validateTimelineState(items: TimelineItem[]) {
  const issues: TimelineValidationIssue[] = [];
  const seenIds = new Set<string>();

  items.forEach((item) => {
    if (seenIds.has(item.id)) {
      issues.push({
        itemId: item.id,
        field: "name",
        message: "내부 ID가 중복되었습니다.",
      });
    }

    seenIds.add(item.id);

    if (!item.name.trim()) {
      issues.push({
        itemId: item.id,
        field: "name",
        message: "항목명을 입력하세요.",
      });
    }

    if (!isValidDateInput(item.date)) {
      issues.push({
        itemId: item.id,
        field: "date",
        message: "날짜는 YYYY-MM-DD 형식이어야 합니다.",
      });
    }

    if (item.color && !isValidGanttTaskColor(item.color)) {
      issues.push({
        itemId: item.id,
        field: "color",
        message: "색상은 #RRGGBB 형식이어야 합니다.",
      });
    }

    if (
      item.status &&
      !timelineStatusOptions.some((option) => option.value === item.status)
    ) {
      issues.push({
        itemId: item.id,
        field: "status",
        message: "상태는 planned, active, done만 허용됩니다.",
      });
    }
  });

  return issues;
}

export function getSortedValidTimelineItems(items: TimelineItem[]) {
  const invalidIds = new Set(validateTimelineState(items).map((issue) => issue.itemId));

  return items
    .filter((item) => !invalidIds.has(item.id))
    .map((item) => ({
      ...item,
      color: normalizeGanttTaskColor(item.color),
      section: item.section?.trim() || "기본 섹션",
    }))
    .sort((left, right) =>
      left.date === right.date ? left.order - right.order : left.date.localeCompare(right.date),
    );
}

export function getTimelineStatusLabel(status?: TimelineStatus) {
  return (
    timelineStatusOptions.find((option) => option.value === status)?.label ??
    "계획"
  );
}
