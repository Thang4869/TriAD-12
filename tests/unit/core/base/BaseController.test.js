import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseController } from "../../../../src/core/base/BaseController.js";

describe("BaseController", () => {
  let controller;
  let mockService;
  let mockRenderer;
  let mockEventBus;

  beforeEach(() => {
    mockService = {};
    mockRenderer = {};
    mockEventBus = {
      on: vi.fn().mockReturnValue(() => {}),
    };
    window.eventBus = mockEventBus;

    controller = new BaseController(mockService, mockRenderer);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete window.eventBus;
  });

  it("should initialize correctly", () => {
    expect(controller._isInitialized).toBe(false);
    controller.initialize();
    expect(controller._isInitialized).toBe(true);
  });

  it("should not re-initialize if already initialized", () => {
    controller.initialize();
    const setupSpy = vi.spyOn(controller, "setupEventListeners");
    controller.initialize();
    expect(setupSpy).not.toHaveBeenCalled();
  });

  it("should setup event listeners (no-op by default)", () => {
    expect(() => controller.setupEventListeners()).not.toThrow();
  });

  it("should destroy and clean up subscriptions", () => {
    const unsubscribe = vi.fn();
    controller._eventSubscriptions = [unsubscribe];
    controller.destroy();
    expect(unsubscribe).toHaveBeenCalled();
    expect(controller._eventSubscriptions).toEqual([]);
    expect(controller._isInitialized).toBe(false);
  });

  it("should subscribe to events", () => {
    const callback = vi.fn();
    const unsubscribe = controller.subscribe("test", callback);
    expect(mockEventBus.on).toHaveBeenCalledWith("test", callback);
    expect(controller._eventSubscriptions).toContain(unsubscribe);
  });
});
