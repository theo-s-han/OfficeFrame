import { describe, expect, it } from "vitest";
import {
  getDayViewMode,
  getMonthViewMode,
  getQuarterViewMode,
  getWeekViewMode,
} from "./GanttChartPreview";

describe("GanttChartPreview view mode config", () => {
  it("builds a day view mode with day ticks and month boundaries", () => {
    const viewMode = getDayViewMode();

    expect(viewMode.name).toBe("Day");
    expect(viewMode.step).toBe("1d");
    expect(viewMode.snap_at).toBe("1d");
    expect(viewMode.thick_line?.(new Date("2026-05-01"))).toBe(true);
    expect(viewMode.thick_line?.(new Date("2026-05-02"))).toBe(false);
  });

  it("builds a week view mode with weekly snapping", () => {
    const viewMode = getWeekViewMode(112);

    expect(viewMode.name).toBe("Week");
    expect(viewMode.step).toBe("7d");
    expect(viewMode.column_width).toBe(112);
    expect(viewMode.snap_at).toBe("7d");
    expect(viewMode.thick_line?.(new Date("2026-05-04"))).toBe(true);
    expect(viewMode.thick_line?.(new Date("2026-05-11"))).toBe(false);
  });

  it("builds a month view mode with year boundaries as major lines", () => {
    const viewMode = getMonthViewMode(140);

    expect(viewMode.name).toBe("Month");
    expect(viewMode.step).toBe("1m");
    expect(viewMode.column_width).toBe(140);
    expect(viewMode.date_format).toBe("YYYY-MM");
    expect(viewMode.snap_at).toBe("7d");
    expect(viewMode.thick_line?.(new Date("2026-01-01"))).toBe(true);
    expect(viewMode.thick_line?.(new Date("2026-05-01"))).toBe(false);
  });

  it("builds a quarter view mode with yearly boundaries as major lines", () => {
    const viewMode = getQuarterViewMode();

    expect(viewMode.name).toBe("Quarter");
    expect(viewMode.step).toBe("3m");
    expect(viewMode.snap_at).toBe("30d");
    expect(viewMode.thick_line?.(new Date("2026-01-01"))).toBe(true);
    expect(viewMode.thick_line?.(new Date("2026-04-01"))).toBe(false);
  });
});
