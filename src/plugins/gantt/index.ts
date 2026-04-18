import type { ToolDefinition } from "@/plugins/types";
import { GanttToolPage } from "./GanttToolPage";

export const ganttTool = {
  id: "gantt",
  name: "간트 차트",
  description: "일정과 진행률을 빠르게 시각화",
  href: "/tools/gantt",
  shortCode: "GT",
  status: "active",
  phase: "skeleton",
  order: 1,
  component: GanttToolPage,
} satisfies ToolDefinition;
