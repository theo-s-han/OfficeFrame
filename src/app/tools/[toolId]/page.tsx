import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getActiveTools } from "@/lib/core/toolRegistry";

type LegacyToolPageProps = {
  params: Promise<{
    toolId: string;
  }>;
};

export function generateStaticParams() {
  return getActiveTools().map((tool) => ({
    toolId: tool.id,
  }));
}

export default async function LegacyToolPage({ params }: LegacyToolPageProps) {
  const { toolId } = await params;

  if (toolId === "gantt") {
    redirect("/gantt");
  }

  if (toolId === "mindmap") {
    redirect("/mindmap");
  }

  notFound();
}
