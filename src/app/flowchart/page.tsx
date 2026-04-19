import Link from "next/link";
import type { Metadata } from "next";
import { FlowchartEditorShell } from "@/components/flowchart/FlowchartEditorShell";

export const metadata: Metadata = {
  title: "플로우차트 | Office Tool",
  description: "문서용 플로우차트 편집기",
};

export default function FlowchartPage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="flowchart-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">플로우차트 에디터</div>
        <h1 id="flowchart-title">플로우차트</h1>
        <p>
          단계, 분기, 연결을 한 화면에서 관리하고 문서/PPT에 붙이기 좋은
          플로우차트를 이미지로 내보냅니다.
        </p>
      </section>

      <FlowchartEditorShell />
    </main>
  );
}
