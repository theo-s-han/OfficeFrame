import { ToolCard } from "@/components/home/ToolCard";
import { getPublicTools } from "@/lib/core/toolRegistry";

export default function HomePage() {
  const tools = getPublicTools();

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="eyebrow">문서용 구조 시각화 도구</div>
        <h1 id="home-title">오피스 문서에 바로 붙일 수 있는 시각화 툴킷</h1>
        <p>
          간트 차트, 마인드맵, 조직도, 플로우차트, 타임라인을 같은 방식의
          입력, 미리보기, 이미지 내보내기 흐름으로 정리했습니다.
        </p>
      </section>

      <section className="tool-grid" aria-label="도구 목록">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </section>
    </main>
  );
}
