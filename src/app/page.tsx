import { ToolCard } from "@/components/home/ToolCard";
import { toolRegistry } from "@/lib/core/toolRegistry";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="eyebrow">문서용 시각화 허브</div>
        <h1 id="home-title">오피스 문서에 바로 쓰는 시각화 도구</h1>
        <p>
          지금은 실행 골격 단계입니다. 간트 차트와 마인드맵이 먼저 열려 있고,
          나머지 도구는 plugin 확장 후보로 표시합니다.
        </p>
      </section>

      <section className="tool-grid" aria-label="도구 목록">
        {toolRegistry.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </section>
    </main>
  );
}
