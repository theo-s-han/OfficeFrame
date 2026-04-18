import Link from "next/link";
import type { Metadata } from "next";
import { GanttEditorShell } from "@/components/gantt/GanttEditorShell";

export const metadata: Metadata = {
  title: "간트 차트 | Office Tool",
  description: "문서용 간트 차트 에디터",
};

export default function GanttPage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="gantt-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">간트 에디터</div>
        <h1 id="gantt-title">간트 차트</h1>
        <p>
          작업 일정과 진행률을 입력하고, 차트에서 드래그로 조정한 뒤 문서용
          PNG로 저장합니다.
        </p>
      </section>

      <GanttEditorShell />
    </main>
  );
}
