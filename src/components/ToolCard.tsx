import Link from "next/link";
import type { ToolDefinition } from "@/plugins/types";

type ToolCardProps = {
  tool: ToolDefinition;
};

export function ToolCard({ tool }: ToolCardProps) {
  const isActive = tool.status === "active";

  return (
    <article className={isActive ? "tool-card active" : "tool-card disabled"}>
      <div className="tool-card-top">
        <span className="tool-icon" aria-hidden="true">
          {tool.shortCode}
        </span>
        <span className="tool-status">
          {isActive ? "사용 가능" : "준비중"}
        </span>
      </div>
      <h2>{tool.name}</h2>
      <p>{tool.description}</p>
      {isActive ? (
        <Link href={tool.href} className="button-link">
          시작하기
        </Link>
      ) : (
        <span className="button-link disabled" aria-disabled="true">
          준비중
        </span>
      )}
    </article>
  );
}
