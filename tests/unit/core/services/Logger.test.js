import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  Logger,
  LoggerService,
} from "../../../../src/core/services/Logger.js";

describe("LoggerService", () => {
  let logger;
  let consoleSpy;

  const setLocationSearch = (search) => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { search },
      writable: true,
    });
  };

  beforeEach(() => {
    logger = new LoggerService();

    consoleSpy = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
      info: vi.spyOn(console, "info").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      group: vi.spyOn(console, "group").mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, "groupEnd").mockImplementation(() => {}),
    };

    localStorage.removeItem("debug");
    setLocationSearch("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.removeItem("debug");
    setLocationSearch("");
  });

  describe("debug detection", () => {
    it("uses INFO level when no debug flag is enabled", () => {
      expect(logger.level).toBe(1);
    });

    it.each([
      {
        name: "localStorage",
        prepare: () => {
          localStorage.setItem("debug", "true");
        },
      },
      {
        name: "URL",
        prepare: () => {
          setLocationSearch("?debug=true");
        },
      },
    ])("enables DEBUG from $name", ({ prepare }) => {
      prepare();

      expect(new LoggerService().level).toBe(0);
    });

    it.each([
      {
        name: "URL=true with localStorage=false",
        prepare: () => {
          localStorage.setItem("debug", "false");
          setLocationSearch("?debug=true");
        },
      },
      {
        name: "URL=false with localStorage=true",
        prepare: () => {
          localStorage.setItem("debug", "true");
          setLocationSearch("?debug=false");
        },
      },
    ])("enables DEBUG when either source is true: $name", ({ prepare }) => {
      prepare();

      expect(new LoggerService().level).toBe(0);
    });

    it.each([
      {
        name: "URL=false",
        prepare: () => {
          setLocationSearch("?debug=false");
        },
      },
      {
        name: "localStorage=false",
        prepare: () => {
          localStorage.setItem("debug", "false");
        },
      },
    ])(
      "keeps INFO when an explicit debug flag is false: $name",
      ({ prepare }) => {
        prepare();

        expect(new LoggerService().level).toBe(1);
      },
    );

    it("falls back to INFO when debug detection throws", () => {
      Object.defineProperty(window, "location", {
        configurable: true,
        get() {
          throw new Error("Location unavailable");
        },
      });

      expect(new LoggerService().level).toBe(1);
    });

    it("keeps DEBUG disabled when window is undefined", () => {
      vi.stubGlobal("window", undefined);

      expect(new LoggerService().level).toBe(1);
    });
  });

  describe("level management", () => {
    it("updates the current log level with setLevel", () => {
      logger.setLevel(3);

      expect(logger.level).toBe(3);

      logger.setLevel(0);

      expect(logger.level).toBe(0);
    });
  });

  describe("log methods", () => {
    beforeEach(() => {
      logger.setLevel(0);
    });

    it.each([
      [
        "debug",
        "debug",
        "[DEBUG]",
        ["message", "extra", 123],
      ],
      [
        "info",
        "info",
        "[INFO]",
        ["message", 456, true],
      ],
      [
        "warn",
        "warn",
        "[WARN]",
        ["message", { key: "value" }],
      ],
      [
        "error",
        "error",
        "[ERROR]",
        ["message", new Error("test")],
      ],
    ])(
      "writes %s messages with all arguments",
      (method, consoleMethod, prefix, args) => {
        logger[method](...args);

        expect(consoleSpy[consoleMethod]).toHaveBeenCalledWith(
          prefix,
          ...args,
        );
      },
    );
  });

  describe("log level filtering", () => {
    it.each([
      ["debug", 0, 1, "debug", "[DEBUG]"],
      ["info", 1, 2, "info", "[INFO]"],
      ["warn", 2, 3, "warn", "[WARN]"],
      ["error", 3, 4, "error", "[ERROR]"],
    ])(
      "logs %s at its minimum level and suppresses it above that level",
      (
        method,
        enabledLevel,
        disabledLevel,
        consoleMethod,
        prefix,
      ) => {
        logger.setLevel(enabledLevel);

        logger[method]("visible");

        expect(consoleSpy[consoleMethod]).toHaveBeenCalledTimes(1);
        expect(consoleSpy[consoleMethod]).toHaveBeenCalledWith(
          prefix,
          "visible",
        );

        logger.setLevel(disabledLevel);

        logger[method]("hidden");

        expect(consoleSpy[consoleMethod]).toHaveBeenCalledTimes(1);
      },
    );

    it("suppresses all log methods at NONE level", () => {
      logger.setLevel(4);

      logger.debug("hidden");
      logger.info("hidden");
      logger.warn("hidden");
      logger.error("hidden");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe("group", () => {
    it("opens, executes, and closes a group in DEBUG mode", () => {
      const callback = vi.fn();

      logger.setLevel(0);

      logger.group("test", callback);

      expect(consoleSpy.group).toHaveBeenCalledWith("test");
      expect(callback).toHaveBeenCalledTimes(1);
      expect(consoleSpy.groupEnd).toHaveBeenCalledTimes(1);
    });

    it("does nothing when DEBUG mode is disabled", () => {
      const callback = vi.fn();

      logger.setLevel(1);

      logger.group("test", callback);

      expect(consoleSpy.group).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
      expect(consoleSpy.groupEnd).not.toHaveBeenCalled();
    });
  });

  describe("exported Logger instance", () => {
    it("exports a LoggerService singleton with a defined level", () => {
      expect(Logger).toBeInstanceOf(LoggerService);
      expect(Logger.level).toBeDefined();
    });
  });
});