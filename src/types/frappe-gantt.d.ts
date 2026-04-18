declare module "frappe-gantt" {
  export type FrappeGanttTask = {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string | string[];
    custom_class?: string;
  };

  export type FrappeGanttViewMode = "Day" | "Week" | "Month" | "Year";

  export type FrappeGanttViewModeConfig = {
    name: string;
    padding?: string | [string, string];
    step?: string;
    column_width?: number;
    date_format?: string;
    lower_text?:
      | string
      | ((date: Date, previousDate: Date | null, language: string) => string);
    upper_text?:
      | string
      | ((date: Date, previousDate: Date | null, language: string) => string);
    upper_text_frequency?: number;
    thick_line?: (date: Date) => boolean;
    snap_at?: string;
  };

  export type FrappeGanttOptions = {
    view_mode?: FrappeGanttViewMode | FrappeGanttViewModeConfig | string;
    view_modes?: Array<FrappeGanttViewMode | FrappeGanttViewModeConfig>;
    date_format?: string;
    readonly?: boolean;
    readonly_dates?: boolean;
    readonly_progress?: boolean;
    show_expected_progress?: boolean;
    infinite_padding?: boolean;
    move_dependencies?: boolean;
    today_button?: boolean;
    view_mode_select?: boolean;
    lines?: "none" | "vertical" | "horizontal" | "both";
    scroll_to?: "today" | "start" | "end" | string | null;
    language?: string;
    popup_on?: "click" | "hover";
    on_click?: (task: FrappeGanttTask) => void;
    on_date_change?: (task: FrappeGanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: FrappeGanttTask, progress: number) => void;
    on_view_change?: (mode: { name: FrappeGanttViewMode }) => void;
    popup?: false | ((props: { task: FrappeGanttTask }) => string | false);
  };

  export default class Gantt {
    constructor(
      wrapper: HTMLElement | SVGElement | string,
      tasks: FrappeGanttTask[],
      options?: FrappeGanttOptions,
    );

    refresh(tasks: FrappeGanttTask[]): void;
    change_view_mode(
      mode: FrappeGanttViewMode | FrappeGanttViewModeConfig | string,
      maintainPosition?: boolean,
    ): void;
    scroll_current(): void;
    update_task(taskId: string, newDetails: Partial<FrappeGanttTask>): void;
  }
}
