import Link from "next/link";
import type { Metadata } from "next";
import { PoseMakerPage } from "@/components/pose/PoseMakerPage";

export const metadata: Metadata = {
  title: "캐릭터 포즈 메이커 | Office Tool",
  description: "문서용 2D/3D 캐릭터 포즈를 빠르게 조정하고 PNG로 내보내는 편집기",
};

export default function PosePage() {
  return (
    <main className="tool-page">
      <section className="tool-heading" aria-labelledby="pose-title">
        <Link href="/" className="back-link">
          홈 허브로 돌아가기
        </Link>
        <div className="eyebrow">캐릭터 포즈 메이커</div>
        <h1 id="pose-title">캐릭터 포즈 메이커</h1>
        <p>
          2D와 3D primitive mannequin으로 포즈를 빠르게 잡고, 문서에 붙여 넣기 좋은 PNG와
          Pose JSON을 함께 가져갑니다.
        </p>
      </section>

      <PoseMakerPage />
    </main>
  );
}
