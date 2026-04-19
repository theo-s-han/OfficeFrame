import Link from "next/link";
import type { Metadata } from "next";
import { FlowchartEditorShell } from "@/components/flowchart/FlowchartEditorShell";

export const metadata: Metadata = {
  title: "플로우차트 | DataViz Studio",
  description: "표준 기호와 조건 분기로 업무 흐름을 설계하는 플로우차트 작성기",
};

export default function FlowchartPage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="flowchart-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">플로우차트 작성기</div>
        <h1 id="flowchart-title">플로우차트</h1>
        <p>
          시작, 처리, 결정, 문서, 데이터, 서브프로세스, 종료 기호를 조합해 실제
          업무 흐름을 정의합니다. 조건 분기와 방향을 입력하면 표준 형태의 차트로
          즉시 정리됩니다.
        </p>
      </section>

      <FlowchartEditorShell />
    </main>
  );
}
