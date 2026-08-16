import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoggerService, Logger } from "../../../../src/core/services/Logger.js";

describe("LoggerService", () => {
  let logger;
  let consoleSpy;

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

    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem("debug");

    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
      configurable: true,
    });
  });

  describe("initialization", () => {
    it("should set default level to INFO unless debug is enabled", () => {
      expect(logger.level).toBe(1);
    });

    it("should enable DEBUG level when localStorage debug=true", () => {
      localStorage.setItem("debug", "true");

      const newLogger = new LoggerService();

      expect(newLogger.level).toBe(0);
    });

    it("should enable DEBUG level when URL param debug=true", () => {
      Object.defineProperty(window, "location", {
        value: { search: "?debug=true" },
        writable: true,
        configurable: true,
      });

      const newLogger = new LoggerService();

      expect(newLogger.level).toBe(0);
    });

    it("should not enable DEBUG when no debug flags are present", () => {
      const newLogger = new LoggerService();

      expect(newLogger.level).toBe(1);
    });

    it("should handle localStorage errors gracefully during debug detection", () => {
      const originalGetItem = localStorage.getItem;

      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error("Storage error");
      });

      const newLogger = new LoggerService();

      expect(newLogger.level).toBe(1);

      localStorage.getItem = originalGetItem;
    });
  });

  describe("level management", () => {
    it("should change log level with setLevel()", () => {
      logger.setLevel(3);

      expect(logger.level).toBe(3);
    });

    it("should support changing log level multiple times", () => {
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

    it("should log DEBUG with multiple arguments", () => {
      logger.debug("msg", "extra", 123);

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        "[DEBUG]",
        "msg",
        "extra",
        123,
      );
    });

    it("should log INFO with multiple arguments", () => {
      logger.info("msg", 456, true);

      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO]", "msg", 456, true);
    });

    it("should log WARN with multiple arguments", () => {
      logger.warn("msg", { key: "value" });

      expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN]", "msg", {
        key: "value",
      });
    });

    it("should log ERROR with multiple arguments", () => {
      const error = new Error("test");

      logger.error("msg", error);

      expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR]", "msg", error);
    });
  });

  describe("log level filtering", () => {
    it("should log DEBUG only when level <= DEBUG", () => {
      logger.setLevel(0);
      logger.debug("debug msg");

      expect(consoleSpy.debug).toHaveBeenCalledWith("[DEBUG]", "debug msg");

      logger.setLevel(1);
      logger.debug("should not log");

      expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
    });

    it("should log INFO only when level <= INFO", () => {
      logger.setLevel(1);
      logger.info("info msg");

      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO]", "info msg");

      logger.setLevel(2);
      logger.info("should not log");

      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    });

    it("should log WARN only when level <= WARN", () => {
      logger.setLevel(2);
      logger.warn("warn msg");

      expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN]", "warn msg");

      logger.setLevel(3);
      logger.warn("should not log");

      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    });

    it("should log ERROR only when level <= ERROR", () => {
      logger.setLevel(3);
      logger.error("error msg");

      expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR]", "error msg");

      logger.setLevel(4);
      logger.error("should not log");

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("group", () => {
    it("should execute group callback only in DEBUG mode", () => {
      const fn = vi.fn();

      logger.setLevel(0);
      logger.group("test", fn);

      expect(consoleSpy.group).toHaveBeenCalledWith("test");
      expect(fn).toHaveBeenCalled();
      expect(consoleSpy.groupEnd).toHaveBeenCalled();

      consoleSpy.group.mockClear();
      consoleSpy.groupEnd.mockClear();
      fn.mockClear();

      logger.setLevel(1);
      logger.group("test", fn);

      expect(consoleSpy.group).not.toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();
      expect(consoleSpy.groupEnd).not.toHaveBeenCalled();
    });

    it("should not call group or groupEnd when level > DEBUG", () => {
      const fn = vi.fn();

      logger.setLevel(2);
      logger.group("test", fn);

      expect(consoleSpy.group).not.toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();
      expect(consoleSpy.groupEnd).not.toHaveBeenCalled();
    });
  });

  describe("LoggerService without window", () => {
    it("should not enable DEBUG when window is undefined", async () => {
      vi.stubGlobal("window", undefined);
      vi.resetModules();

      const { LoggerService: LoggerServiceWithoutWindow } =
        await import("../../../../src/core/services/Logger.js");

      const loggerWithoutWindow = new LoggerServiceWithoutWindow();

      expect(loggerWithoutWindow.level).toBe(1);

      vi.unstubAllGlobals();
      vi.resetModules();

      await import("../../../../src/core/services/Logger.js");
    });
  });

  describe("exported Logger instance", () => {
    it("should be an instance of LoggerService", () => {
      expect(Logger).toBeInstanceOf(LoggerService);
    });

    it("should have a defined log level", () => {
      expect(Logger.level).toBeDefined();
    });
  });

  describe("additional coverage", () => {
    it("should verify multiple DEBUG calls", () => {
      logger.setLevel(0);

      logger.debug("msg1");
      logger.debug("msg2");

      expect(consoleSpy.debug).toHaveBeenCalledTimes(2);
    });
  });
});
