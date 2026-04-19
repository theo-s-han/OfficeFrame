import Link from "next/link";
import type { Metadata } from "next";
import { TimelineEditorShell } from "@/components/timeline/TimelineEditorShell";

export const metadata: Metadata = {
  title: "타임라인 | Office Tool",
  description: "문서용 타임라인 편집기",
};

export default function TimelinePage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="timeline-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">타임라인 에디터</div>
        <h1 id="timeline-title">타임라인</h1>
        <p>
          날짜 중심 이벤트를 정리하고, 보고서와 발표 자료에 넣기 좋은
          타임라인 이미지를 바로 만들 수 있습니다.
        </p>
      </section>

      <TimelineEditorShell />
    </main>
  );
}
