const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

const DEFAULT_LEVEL = LOG_LEVELS.INFO;

function isDebugEnabled() {
  if (typeof window === "undefined") return false;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get("debug") === "true";
    const fromStorage = localStorage.getItem("debug") === "true";
    return fromUrl || fromStorage;
  } catch {
    return false;
  }
}

export class LoggerService {
  constructor(level = DEFAULT_LEVEL) {
    this.level = isDebugEnabled() ? LOG_LEVELS.DEBUG : level;
  }

  setLevel(level) {
    this.level = level;
  }

  debug(...args) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug("[DEBUG]", ...args);
    }
  }

  info(...args) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info("[INFO]", ...args);
    }
  }

  warn(...args) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn("[WARN]", ...args);
    }
  }

  error(...args) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error("[ERROR]", ...args);
    }
  }

  group(label, fn) {
    if (this.level > LOG_LEVELS.DEBUG) return;
    console.group(label);
    fn();
    console.groupEnd();
  }
}

export const Logger = new LoggerService();
