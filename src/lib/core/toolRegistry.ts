export type ToolStatus = "active" | "placeholder";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  href: string;
  shortCode: string;
  status: ToolStatus;
  order: number;
};

export const toolRegistry = [
  {
    id: "gantt",
    name: "간트 차트",
    description: "일정과 진행률을 빠르게 시각화",
    href: "/gantt",
    shortCode: "GT",
    status: "active",
    order: 1,
  },
  {
    id: "mindmap",
    name: "마인드맵",
    description: "아이디어와 구조를 계층적으로 정리",
    href: "/mindmap",
    shortCode: "MM",
    status: "active",
    order: 2,
  },
  {
    id: "org-chart",
    name: "조직도",
    description: "역할과 보고 체계를 문서용 이미지로 정리",
    href: "#",
    shortCode: "OC",
    status: "placeholder",
    order: 3,
  },
  {
    id: "flowchart",
    name: "플로우차트",
    description: "업무 흐름과 판단 경로를 간단히 표현",
    href: "#",
    shortCode: "FC",
    status: "placeholder",
    order: 4,
  },
  {
    id: "timeline",
    name: "타임라인",
    description: "주요 이벤트와 마일스톤을 시간순으로 배치",
    href: "#",
    shortCode: "TL",
    status: "placeholder",
    order: 5,
  },
] satisfies ToolDefinition[];

export function getActiveTools() {
  return toolRegistry.filter((tool) => tool.status === "active");
}
