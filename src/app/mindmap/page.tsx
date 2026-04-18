import Link from "next/link";
import type { Metadata } from "next";
import { MindmapEditorShell } from "@/components/mindmap/MindmapEditorShell";

export const metadata: Metadata = {
  title: "마인드맵 | Office Tool",
  description: "문서용 마인드맵 에디터",
};

export default function MindmapPage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="mindmap-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">마인드맵 에디터</div>
        <h1 id="mindmap-title">마인드맵</h1>
        <p>
          아이디어와 구조를 계층적으로 정리하고, 문서에 바로 붙여넣기 좋은
          PNG로 저장합니다.
        </p>
      </section>

      <MindmapEditorShell />
    </main>
  );
}
