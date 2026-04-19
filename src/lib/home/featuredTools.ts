import { getPublicTools, type ToolDefinition } from "@/lib/core/toolRegistry";

type HomeFeatureConfig = {
  id: ToolDefinition["id"];
  category: string;
  eyebrow: string;
  homeDescription: string;
  highlights: [string, string, string];
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  ctaLabel: string;
  spotlight: "primary" | "secondary";
  chipLabel: string;
};

export type HomeFeaturedTool = ToolDefinition & HomeFeatureConfig;

const homeFeatureConfigs: HomeFeatureConfig[] = [
  {
    id: "gantt",
    category: "일정 계획",
    eyebrow: "프로젝트 일정과 진행률",
    homeDescription:
      "작업 일정, 기간, 진행률을 한 화면에서 정리하고 바로 문서형 간트 차트로 내보냅니다.",
    highlights: ["작업·기간 입력", "미리보기 바로 확인", "PNG로 즉시 내보내기"],
    imageSrc: "/assets/home/gantt-preview.png",
    imageAlt: "간트 차트 도구 화면 미리보기",
    imageWidth: 1440,
    imageHeight: 960,
    ctaLabel: "간트 차트 시작하기",
    spotlight: "primary",
    chipLabel: "대표 기능",
  },
  {
    id: "mindmap",
    category: "아이디어 구조화",
    eyebrow: "주제와 가지를 빠르게 정리",
    homeDescription:
      "생각, 개요, 구조를 계층형 마인드맵으로 정리해 발표 자료와 기획 문서에 바로 붙일 수 있습니다.",
    highlights: ["주제 계층 편집", "실시간 구조 미리보기", "문서용 PNG export"],
    imageSrc: "/assets/home/mindmap-preview.png",
    imageAlt: "마인드맵 도구 화면 미리보기",
    imageWidth: 1440,
    imageHeight: 960,
    ctaLabel: "마인드맵 열기",
    spotlight: "primary",
    chipLabel: "대표 기능",
  },
  {
    id: "org-chart",
    category: "조직 구조",
    eyebrow: "팀과 역할 관계를 카드형으로",
    homeDescription:
      "조직 구성, 보고 체계, 부서 구조를 읽기 쉬운 카드형 조직도로 정리합니다.",
    highlights: ["상하 관계 입력", "카드형 조직도 생성", "PNG export"],
    imageSrc: "/assets/home/org-chart-preview.png",
    imageAlt: "조직도 도구 화면 미리보기",
    imageWidth: 1440,
    imageHeight: 960,
    ctaLabel: "조직도 열기",
    spotlight: "secondary",
    chipLabel: "보조 기능",
  },
  {
    id: "flowchart",
    category: "프로세스 설계",
    eyebrow: "흐름과 분기 단계를 시각화",
    homeDescription:
      "업무 흐름과 의사결정 단계를 하나의 플로우차트로 정리해 전달력을 높입니다.",
    highlights: ["단계와 연결 정의", "분기 흐름 표현", "문서형 결과물 export"],
    imageSrc: "/assets/home/flowchart-preview.png",
    imageAlt: "플로우차트 도구 화면 미리보기",
    imageWidth: 1440,
    imageHeight: 960,
    ctaLabel: "플로우차트 열기",
    spotlight: "secondary",
    chipLabel: "보조 기능",
  },
];

export function getHomeFeaturedTools(): HomeFeaturedTool[] {
  const publicToolsById = new Map(
    getPublicTools().map((tool) => [tool.id, tool] as const),
  );

  return homeFeatureConfigs.map((config) => {
    const tool = publicToolsById.get(config.id);

    if (!tool) {
      throw new Error(`Missing public tool for home feature: ${config.id}`);
    }

    return {
      ...tool,
      ...config,
    };
  });
}
