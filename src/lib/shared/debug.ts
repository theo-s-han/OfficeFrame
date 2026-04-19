type ToolDebugQueryOptions = {
  acceptAll?: boolean;
  debugKeys: readonly string[];
};

type RecordToolDebugEventOptions<Entry> = {
  consoleArgs?: (entry: Entry) => unknown[];
  consoleMethod?: "debug" | "info";
  consoleTag: string;
  enabled: boolean;
  entry: Entry;
  windowKey: string;
};

function createSearchParams(search: string) {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

export function readToolDebugEnabledFromSources(
  search: string,
  storedValue: string | null | undefined,
  options: ToolDebugQueryOptions,
): boolean {
  if (storedValue === "true") {
    return true;
  }

  const debugValues = createSearchParams(search).getAll("debug");

  if ((options.acceptAll ?? true) && debugValues.includes("all")) {
    return true;
  }

  return debugValues.some((value) => options.debugKeys.includes(value));
}

export function readToolDebugEnabled(
  storageKey: string,
  options: ToolDebugQueryOptions,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return readToolDebugEnabledFromSources(
    window.location.search,
    window.localStorage.getItem(storageKey),
    options,
  );
}

export function recordToolDebugEvent<Entry>(
  options: RecordToolDebugEventOptions<Entry>,
): Entry | null {
  if (!options.enabled || typeof window === "undefined") {
    return null;
  }

  const debugWindow = window as unknown as Window &
    Record<string, Entry[] | undefined>;

  debugWindow[options.windowKey] = [
    ...(debugWindow[options.windowKey] ?? []),
    options.entry,
  ];

  if (typeof console !== "undefined") {
    const consoleMethod = options.consoleMethod ?? "info";
    const consoleArgs = options.consoleArgs?.(options.entry) ?? [
      options.consoleTag,
      options.entry,
    ];

    console[consoleMethod](...consoleArgs);
  }

  return options.entry;
}
