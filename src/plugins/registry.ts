export {
  getActiveTools,
  getPublicTools,
  toolRegistry,
} from "@/lib/core/toolRegistry";
import { toolRegistry } from "@/lib/core/toolRegistry";

export function getToolById(toolId: string) {
  return toolRegistry.find((tool) => tool.id === toolId);
}
