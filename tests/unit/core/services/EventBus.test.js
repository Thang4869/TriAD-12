import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../../../src/core/services/EventBus.js";

describe("EventBus", () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("on", () => {
    it("should subscribe and emit events", () => {
      const callback = vi.fn();
      eventBus.on("test", callback);
      eventBus.emit("test", { data: "test" });
      expect(callback).toHaveBeenCalledWith({ data: "test" });
    });

    it("should throw error if callback is not a function", () => {
      expect(() => eventBus.on("test", null)).toThrow(
        "Callback must be a function",
      );
      expect(() => eventBus.on("test", undefined)).toThrow(
        "Callback must be a function",
      );
      expect(() => eventBus.on("test", "not a function")).toThrow(
        "Callback must be a function",
      );
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on("test", callback);
      unsubscribe();
      eventBus.emit("test");
      expect(callback).not.toHaveBeenCalled();
    });

    it("should support multiple subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on("test", callback1);
      eventBus.on("test", callback2);
      eventBus.emit("test");
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe("once", () => {
    it("should execute callback only once", () => {
      const callback = vi.fn();
      eventBus.once("test", callback);
      eventBus.emit("test");
      eventBus.emit("test");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should remove once event from _onceEvents after emit", () => {
      const callback = vi.fn();
      eventBus.once("test", callback);
      expect(eventBus._onceEvents.has("test")).toBe(true);
      eventBus.emit("test");
      expect(eventBus._onceEvents.has("test")).toBe(false);
    });

    it("should support context binding", () => {
      const context = { value: 42 };
      const callback = vi.fn(function (data) {
        expect(this.value).toBe(42);
        expect(data).toBe("data");
      });
      eventBus.once("test", callback, context);
      eventBus.emit("test", "data");
      expect(callback).toHaveBeenCalledWith("data");
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.once("test", callback);
      unsubscribe();
      eventBus.emit("test");
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("off", () => {
    it("should remove specific callback", () => {
      const callback = vi.fn();
      eventBus.on("test", callback);
      eventBus.off("test", callback);
      eventBus.emit("test");
      expect(callback).not.toHaveBeenCalled();
    });

    it("should remove callback with specific context", () => {
      const context = { id: 1 };
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on("test", callback1, context);
      eventBus.on("test", callback2);

      eventBus.off("test", callback1, context);
      eventBus.emit("test");

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should not remove callback if context differs", () => {
      const context1 = { id: 1 };
      const context2 = { id: 2 };
      const callback = vi.fn();
      eventBus.on("test", callback, context1);
      eventBus.off("test", callback, context2);
      eventBus.emit("test");
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should delete event entry when no callbacks remain", () => {
      const callback = vi.fn();
      eventBus.on("test", callback);
      expect(eventBus._events.has("test")).toBe(true);
      eventBus.off("test", callback);
      expect(eventBus._events.has("test")).toBe(false);
    });

    it("should keep event entry when some callbacks remain", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on("test", callback1);
      eventBus.on("test", callback2);
      eventBus.off("test", callback1);
      expect(eventBus._events.has("test")).toBe(true);
      expect(eventBus._events.get("test").length).toBe(1);
    });

    it("should do nothing if event does not exist", () => {
      const callback = vi.fn();
      expect(() => eventBus.off("non-existent", callback)).not.toThrow();
      expect(eventBus._events.has("non-existent")).toBe(false);
    });

    it("should do nothing if callback not found", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on("test", callback1);
      eventBus.off("test", callback2);
      expect(eventBus._events.get("test").length).toBe(1);
    });
  });

  describe("emit", () => {
    it("should call all subscribers with data", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.on("test", callback1);
      eventBus.on("test", callback2);
      eventBus.emit("test", { value: 123 });
      expect(callback1).toHaveBeenCalledWith({ value: 123 });
      expect(callback2).toHaveBeenCalledWith({ value: 123 });
    });

    it("should call subscribers with context binding", () => {
      const context = { name: "ctx" };
      const callback = vi.fn(function (data) {
        expect(this).toBe(context);
        expect(data).toBe("data");
      });
      eventBus.on("test", callback, context);
      eventBus.emit("test", "data");
      expect(callback).toHaveBeenCalledWith("data");
    });

    it("should do nothing if event has no subscribers", () => {
      expect(() => eventBus.emit("non-existent")).not.toThrow();
    });

    it("should catch and log errors in callbacks", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("callback error");
      const callback = vi.fn(() => {
        throw error;
      });
      eventBus.on("test", callback);
      eventBus.emit("test", { data: "test" });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "EventBus error in test:",
        error,
      );
    });

    it("should delete once event after emission", () => {
      const callback = vi.fn();
      eventBus.once("test", callback);
      expect(eventBus._onceEvents.has("test")).toBe(true);
      eventBus.emit("test");
      expect(eventBus._onceEvents.has("test")).toBe(false);
    });

    it("should keep once events for other events unchanged", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.once("test1", callback1);
      eventBus.once("test2", callback2);
      eventBus.emit("test1");
      expect(eventBus._onceEvents.has("test1")).toBe(false);
      expect(eventBus._onceEvents.has("test2")).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all events and once events", () => {
      const callback = vi.fn();
      eventBus.on("test1", callback);
      eventBus.once("test2", callback);
      eventBus.clear();
      expect(eventBus._events.size).toBe(0);
      expect(eventBus._onceEvents.size).toBe(0);
      eventBus.emit("test1");
      eventBus.emit("test2");
      expect(callback).not.toHaveBeenCalled();
    });
  });
});