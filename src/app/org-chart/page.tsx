import Link from "next/link";
import type { Metadata } from "next";
import { OrgChartEditorShell } from "@/components/org-chart/OrgChartEditorShell";

export const metadata: Metadata = {
  title: "조직도 | Office Tool",
  description: "문서용 조직도 편집기",
};

export default function OrgChartPage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="org-chart-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">조직도 에디터</div>
        <h1 id="org-chart-title">조직도</h1>
        <p>
          이름, 직책, 상위 항목을 입력하고 카드형 조직도 미리보기를 문서용
          이미지로 바로 내보냅니다.
        </p>
      </section>

      <OrgChartEditorShell />
    </main>
  );
}
