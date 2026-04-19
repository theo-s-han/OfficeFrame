import Link from "next/link";

export function AppHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-link" aria-label="홈으로 이동">
        <span className="brand-mark">DV</span>
        <span className="brand-copy">
          <span className="brand-name">DataViz Studio</span>
          <span className="brand-subtitle">문서형 데이터 시각화</span>
        </span>
      </Link>
      <span className="phase-label">Document-ready PNG</span>
    </header>
  );
}
