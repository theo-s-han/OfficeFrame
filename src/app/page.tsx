import Link from "next/link";
import { ToolCard } from "@/components/home/ToolCard";
import { getHomeFeaturedTools } from "@/lib/home/featuredTools";

const workflowSteps = [
  {
    title: "입력",
    description: "일정, 구조, 흐름 데이터를 필요한 형식으로 정리합니다.",
  },
  {
    title: "미리보기",
    description: "도구별 preview로 결과물을 바로 확인하고 다듬습니다.",
  },
  {
    title: "PNG export",
    description: "문서와 발표 자료에 붙이기 좋은 결과물로 바로 내보냅니다.",
  },
] as const;

export default function HomePage() {
  const tools = getHomeFeaturedTools();
  const primaryActions = tools.slice(0, 2);

  return (
    <main className="home-page home-page-product">
      <section className="home-overview" aria-labelledby="home-title">
        <div className="home-product-row">
          <span className="home-product-badge">DataViz Studio</span>
          <span className="home-product-badge muted">Document-ready PNG</span>
        </div>
        <h1 id="home-title">업무 데이터를 문서형 시각화로 바로 정리하세요</h1>
        <p>
          간트 차트, 마인드맵, 조직도, 플로우차트를 대표 기능 중심으로
          정리했습니다. 입력부터 미리보기, PNG 내보내기까지 같은 흐름으로
          이어져서 기획서, 보고서, 발표 자료에 바로 붙일 수 있습니다.
        </p>

        <div className="home-action-row">
          {primaryActions.map((tool, index) => (
            <Link
              key={tool.id}
              href={tool.href}
              className={
                index === 0 ? "button-link" : "button-link button-link-secondary"
              }
            >
              {tool.ctaLabel}
            </Link>
          ))}
        </div>

        <div className="home-proof-grid" aria-label="제품 특징">
          <article className="home-proof-card">
            <strong>대표 기능 4개</strong>
            <span>일정 계획, 구조화, 조직도, 프로세스 설계를 먼저 보여줍니다.</span>
          </article>
          <article className="home-proof-card">
            <strong>문서용 결과물</strong>
            <span>모든 대표 기능은 문서에 붙이기 좋은 PNG export 흐름을 갖습니다.</span>
          </article>
          <article className="home-proof-card">
            <strong>같은 편집 흐름</strong>
            <span>입력, preview, export가 도구마다 비슷하게 이어져 학습 부담이 낮습니다.</span>
          </article>
        </div>
      </section>

      <section className="home-feature-section" aria-labelledby="home-feature-title">
        <div className="home-section-copy">
          <div className="eyebrow">대표 기능</div>
          <h2 id="home-feature-title">필요한 시각화를 바로 고르세요</h2>
          <p>
            각 카드에서 어떤 결과물이 만들어지는지 미리보기 이미지를 먼저
            보여주고, 바로 해당 도구로 진입할 수 있게 구성했습니다.
          </p>
        </div>

        <div className="home-feature-grid" aria-label="대표 기능 목록">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="home-workflow" aria-labelledby="home-workflow-title">
        <div className="home-section-copy">
          <div className="eyebrow">Workflow</div>
          <h2 id="home-workflow-title">입력부터 PNG까지 같은 흐름으로</h2>
          <p>
            도구 종류가 달라도 기본 동작은 비슷하게 유지해서, 필요한 화면을
            빠르게 고르고 곧바로 결과물을 만드는 데 집중할 수 있습니다.
          </p>
        </div>

        <div className="home-workflow-grid">
          {workflowSteps.map((step, index) => (
            <article key={step.title} className="home-step-card">
              <span className="home-step-number">0{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-note" aria-label="대표 기능 안내">
        <p>
          현재 홈은 대표 기능 중심으로 구성했습니다. 다른 도구는 추후 홈 노출
          범위를 다시 조정할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
