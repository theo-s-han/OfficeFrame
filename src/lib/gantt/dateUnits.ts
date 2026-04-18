import {
  compareDateInputs,
  formatDateForInput,
  getTodayDateString,
  isValidDateInput,
  type GanttDateUnit,
  type GanttTask,
  type GanttViewMode,
} from "./taskModel";

export type TimelineRange = {
  start: string;
  end: string;
};

export type QuarterOption = {
  value: string;
  label: string;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function getDateUnitFromViewMode(
  viewMode: GanttViewMode,
): GanttDateUnit {
  if (viewMode === "Day") {
    return "day";
  }

  if (viewMode === "Week") {
    return "week";
  }

  if (viewMode === "Month") {
    return "month";
  }

  return "quarter";
}

export function getViewModeFromDateUnit(
  dateUnit: GanttDateUnit,
): GanttViewMode {
  if (dateUnit === "day") {
    return "Day";
  }

  if (dateUnit === "week") {
    return "Week";
  }

  if (dateUnit === "month") {
    return "Month";
  }

  return "Quarter";
}

export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * millisecondsPerDay);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  return addDays(date, diff);
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;

  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

export function endOfQuarter(date: Date): Date {
  const quarterStart = startOfQuarter(date);

  return new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
}

export function snapDateToUnit(
  value: string,
  viewMode: GanttViewMode,
  boundary: "start" | "end",
): string {
  if (!isValidDateInput(value)) {
    return value;
  }

  const date = parseDateInput(value);

  if (viewMode === "Week") {
    return formatDateForInput(
      boundary === "start" ? startOfWeek(date) : endOfWeek(date),
    );
  }

  if (viewMode === "Month") {
    return formatDateForInput(
      boundary === "start" ? startOfMonth(date) : endOfMonth(date),
    );
  }

  if (viewMode === "Quarter") {
    return formatDateForInput(
      boundary === "start" ? startOfQuarter(date) : endOfQuarter(date),
    );
  }

  return value;
}

export function getMonthInputValue(value: string): string {
  return isValidDateInput(value) ? value.slice(0, 7) : "";
}

export function getQuarterInputValue(value: string): string {
  if (!isValidDateInput(value)) {
    return "";
  }

  const date = parseDateInput(value);
  const quarter = Math.floor(date.getMonth() / 3) + 1;

  return `${date.getFullYear()}-Q${quarter}`;
}

export function getWeekInputValue(value: string): string {
  if (!isValidDateInput(value)) {
    return "";
  }

  const date = parseDateInput(value);
  const thursday = addDays(date, 3 - ((date.getDay() + 6) % 7));
  const weekYear = thursday.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4);
  const firstWeekStart = startOfWeek(firstThursday);
  const weekNumber =
    Math.floor(
      (startOfWeek(date).getTime() - firstWeekStart.getTime()) /
        (7 * millisecondsPerDay),
    ) + 1;

  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getWeekOfMonthLabel(date: Date): string {
  const weekOfMonth = Math.floor((date.getDate() - 1) / 7) + 1;

  return `${weekOfMonth}주`;
}

export function getMonthHeaderLabel(date: Date): string {
  return `${date.getMonth() + 1}월`;
}

export function getDateUnitInputValue(
  value: string,
  viewMode: GanttViewMode,
): string {
  if (viewMode === "Week") {
    return getWeekInputValue(value);
  }

  if (viewMode === "Month") {
    return getMonthInputValue(value);
  }

  if (viewMode === "Quarter") {
    return getQuarterInputValue(value);
  }

  return value;
}

export function resolveDateUnitInputValue(
  value: string,
  viewMode: GanttViewMode,
  boundary: "start" | "end",
): string {
  if (viewMode === "Week") {
    const match = value.match(/^(\d{4})-W(\d{2})$/);

    if (!match) {
      return "";
    }

    const year = Number(match[1]);
    const week = Number(match[2]);
    const firstWeekStart = startOfWeek(new Date(year, 0, 4));
    const start = addDays(firstWeekStart, (week - 1) * 7);

    return formatDateForInput(boundary === "start" ? start : addDays(start, 6));
  }

  if (viewMode === "Month") {
    const match = value.match(/^(\d{4})-(\d{2})$/);

    if (!match) {
      return "";
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const date =
      boundary === "start"
        ? new Date(year, month, 1)
        : new Date(year, month + 1, 0);

    return formatDateForInput(date);
  }

  if (viewMode === "Quarter") {
    const match = value.match(/^(\d{4})-Q([1-4])$/);

    if (!match) {
      return "";
    }

    const year = Number(match[1]);
    const quarter = Number(match[2]);
    const month = (quarter - 1) * 3;
    const date =
      boundary === "start"
        ? new Date(year, month, 1)
        : new Date(year, month + 3, 0);

    return formatDateForInput(date);
  }

  return value;
}

export function getTimelineRangeForTasks(
  tasks: GanttTask[],
  viewMode: GanttViewMode,
): TimelineRange {
  const validDates = tasks
    .flatMap((task) => [
      task.start,
      task.end,
      task.baselineStart,
      task.baselineEnd,
    ])
    .filter(
      (value): value is string =>
        typeof value === "string" && isValidDateInput(value),
    );

  if (validDates.length === 0) {
    const today = getTodayDateString();

    return {
      start: snapDateToUnit(today, viewMode, "start"),
      end: today,
    };
  }

  const sortedDates = [...validDates].sort(compareDateInputs);

  return {
    start: snapDateToUnit(sortedDates[0], viewMode, "start"),
    end: sortedDates[sortedDates.length - 1],
  };
}

export function getTaskDateBounds(tasks: GanttTask[]): TimelineRange | null {
  const validDates = tasks
    .flatMap((task) => [
      task.start,
      task.end,
      task.baselineStart,
      task.baselineEnd,
    ])
    .filter(
      (value): value is string =>
        typeof value === "string" && isValidDateInput(value),
    );

  if (validDates.length === 0) {
    return null;
  }

  const sortedDates = [...validDates].sort(compareDateInputs);

  return {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1],
  };
}

export function isTimelineRangeValid(range: TimelineRange): boolean {
  return (
    isValidDateInput(range.start) &&
    isValidDateInput(range.end) &&
    compareDateInputs(range.end, range.start) >= 0
  );
}

export function getFrappeRangeEnd(
  timelineEnd: string,
  viewMode: GanttViewMode,
): string {
  if (!isValidDateInput(timelineEnd)) {
    return timelineEnd;
  }

  const endDate = parseDateInput(timelineEnd);

  if (viewMode === "Week") {
    return formatDateForInput(addDays(endDate, 7));
  }

  if (viewMode === "Month") {
    return formatDateForInput(addMonths(endDate, 1));
  }

  if (viewMode === "Quarter") {
    return formatDateForInput(addMonths(endDate, 3));
  }

  return formatDateForInput(addDays(endDate, 1));
}

export function getQuarterLabel(value: string): string {
  const match = value.match(/^(\d{4})-Q([1-4])$/);

  if (!match) {
    return value;
  }

  return `${match[1]}년 ${match[2]}분기`;
}

export function getQuarterOptionsForRange(
  range: TimelineRange,
  tasks: GanttTask[],
): QuarterOption[] {
  const dates = [
    range.start,
    range.end,
    ...tasks.flatMap((task) => [
      task.start,
      task.end,
      task.baselineStart,
      task.baselineEnd,
    ]),
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" && isValidDateInput(value),
    )
    .map(parseDateInput);

  if (dates.length === 0) {
    dates.push(parseDateInput(getTodayDateString()));
  }

  const years = dates.map((date) => date.getFullYear());
  const startYear = Math.min(...years) - 1;
  const endYear = Math.max(...years) + 1;
  const options: QuarterOption[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    for (let quarter = 1; quarter <= 4; quarter += 1) {
      const value = `${year}-Q${quarter}`;
      options.push({
        value,
        label: getQuarterLabel(value),
      });
    }
  }

  return options;
}
