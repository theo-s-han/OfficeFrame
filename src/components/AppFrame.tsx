import Link from "next/link";
import type { ReactNode } from "react";

type AppFrameProps = {
  children: ReactNode;
};

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="app-frame">
      <header className="site-header">
        <Link href="/" className="brand-link" aria-label="홈으로 이동">
          <span className="brand-mark">OT</span>
          <span>Office Tool</span>
        </Link>
        <span className="phase-label">Execution Skeleton</span>
      </header>
      {children}
    </div>
  );
}
