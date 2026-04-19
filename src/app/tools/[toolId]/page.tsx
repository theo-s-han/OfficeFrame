import { notFound, redirect } from "next/navigation";
import { getActiveTools } from "@/lib/core/toolRegistry";

type LegacyToolPageProps = {
  params: Promise<{
    toolId: string;
  }>;
};

const legacyRedirectMap: Record<string, string> = {
  gantt: "/gantt",
  mindmap: "/mindmap",
  "org-chart": "/org-chart",
  flowchart: "/flowchart",
  timeline: "/timeline",
};

export function generateStaticParams() {
  return getActiveTools().map((tool) => ({
    toolId: tool.id,
  }));
}

export default async function LegacyToolPage({ params }: LegacyToolPageProps) {
  const { toolId } = await params;
  const target = legacyRedirectMap[toolId];

  if (target) {
    redirect(target);
  }

  notFound();
}
