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
    description: "일정과 진행률을 문서용 차트로 정리합니다.",
    href: "/gantt",
    shortCode: "GT",
    status: "active",
    order: 1,
  },
  {
    id: "mindmap",
    name: "마인드맵",
    description: "아이디어와 구조를 계층형 이미지로 정리합니다.",
    href: "/mindmap",
    shortCode: "MM",
    status: "active",
    order: 2,
  },
  {
    id: "org-chart",
    name: "조직도",
    description: "역할, 보고 구조, 부서를 카드형 조직도로 보여줍니다.",
    href: "/org-chart",
    shortCode: "OC",
    status: "active",
    order: 3,
  },
  {
    id: "flowchart",
    name: "플로우차트",
    description: "업무 흐름과 분기 단계를 한 화면의 다이어그램으로 정리합니다.",
    href: "/flowchart",
    shortCode: "FC",
    status: "active",
    order: 4,
  },
  {
    id: "timeline",
    name: "타임라인",
    description: "주요 이벤트와 일정 흐름을 날짜 순서대로 정리합니다.",
    href: "/timeline",
    shortCode: "TL",
    status: "active",
    order: 5,
  },
] satisfies ToolDefinition[];

export function getActiveTools() {
  return toolRegistry
    .filter((tool) => tool.status === "active")
    .sort((left, right) => left.order - right.order);
}
