type LogMethod = (...args: unknown[]) => void;

type RendererLogger = {
  log: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
  scope: (name: string) => RendererLogger;
};

const createLogger = (scope: string): RendererLogger => {
  const prefix = scope ? `[${scope}]` : "[Hydra]";
  const write = (method: "log" | "info" | "warn" | "error" | "debug"): LogMethod =>
    (...args) => {
      const output = console[method] ?? console.log;
      output.call(console, prefix, ...args);
    };

  return {
    log: write("log"),
    info: write("info"),
    warn: write("warn"),
    error: write("error"),
    debug: write("debug"),
    scope: (name) => createLogger(scope ? `${scope}:${name}` : name),
  };
};

// The renderer can also run in a browser-based Android shell. Importing
// electron-log/renderer here would make that runtime depend on Electron before
// the application has a chance to select a platform adapter.
export const logger = createLogger("renderer");
