import Link from "next/link";

export function AppHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-link" aria-label="홈으로 이동">
        <span className="brand-mark">OT</span>
        <span>Office Tool</span>
      </Link>
      <span className="phase-label">Execution Skeleton</span>
    </header>
  );
}
