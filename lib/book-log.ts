type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, scope: string, message: string, detail?: unknown) {
  const prefix = `[book:${scope}]`;
  if (level === "error") console.error(prefix, message, detail ?? "");
  else if (level === "warn") console.warn(prefix, message, detail ?? "");
  else console.info(prefix, message, detail ?? "");
}

export const bookLog = {
  info: (scope: string, message: string, detail?: unknown) =>
    log("info", scope, message, detail),
  warn: (scope: string, message: string, detail?: unknown) =>
    log("warn", scope, message, detail),
  error: (scope: string, message: string, detail?: unknown) =>
    log("error", scope, message, detail),
};
