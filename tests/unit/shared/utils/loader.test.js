import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadComponent,
  loadComponents,
  injectComponent,
} from "../../../../src/shared/utils/loader.js";

describe("loader", () => {
  let originalLocation;

  beforeEach(() => {
    originalLocation = window.location;
    delete window.location;
    window.location = { pathname: "/" };

    document.body.innerHTML = '<div id="test-container"></div>';
    global.fetch = vi.fn();

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.clearAllMocks();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  const waitForPromises = () =>
    new Promise((resolve) => setTimeout(resolve, 0));

  describe("loadComponent", () => {
    it("should load and insert HTML when response ok", async () => {
      const mockHtml = "<div>Test</div>";
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await loadComponent("test-container", "test.html");
      expect(result).toBe(mockHtml);
      expect(document.getElementById("test-container").innerHTML).toBe(
        mockHtml,
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Loading:"),
      );
      expect(console.log).toHaveBeenCalledWith("Loaded: test.html");
    });

    it("should handle response not ok (HTTP error)", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await loadComponent("test-container", "test.html");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error loading test.html:",
        expect.any(Error),
      );
      const error = console.error.mock.calls[0][1];
      expect(error.message).toBe("HTTP 404: Not Found");
    });

    it("should handle network error (fetch reject)", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));
      const result = await loadComponent("test-container", "test.html");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error loading test.html:",
        expect.any(Error),
      );
    });

    it("should handle element not found", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<div>Test</div>",
      });

      const result = await loadComponent("non-existent", "test.html");
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        "Element #non-existent not found",
      );
    });

    it("should call callback after insertion", async () => {
      const callback = vi.fn();
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<div>Test</div>",
      });

      await loadComponent("test-container", "test.html", callback);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("loadComponents", () => {
    it("should load multiple components and collect results", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<div>Test</div>",
      });

      const components = [
        { elementId: "test-container", filePath: "test1.html" },
        { elementId: "test-container", filePath: "test2.html" },
      ];

      const results = await loadComponents(components);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].filePath).toBe("test1.html");
    });

    it("should start independent component requests concurrently and preserve result order", async () => {
      let resolveFirst;
      let resolveSecond;

      global.fetch
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveSecond = resolve;
            }),
        );

      document.body.innerHTML =
        '<div id="first-container"></div><div id="second-container"></div>';

      const loading = loadComponents([
        { elementId: "first-container", filePath: "first.html" },
        { elementId: "second-container", filePath: "second.html" },
      ]);

      expect(global.fetch).toHaveBeenCalledTimes(2);

      resolveSecond({
        ok: true,
        text: async () => "<p>Second</p>",
      });
      resolveFirst({
        ok: true,
        text: async () => "<p>First</p>",
      });

      const results = await loading;

      expect(results.map(({ filePath }) => filePath)).toEqual([
        "first.html",
        "second.html",
      ]);
      expect(results.every(({ success }) => success)).toBe(true);
      expect(document.getElementById("first-container").innerHTML).toBe(
        "<p>First</p>",
      );
      expect(document.getElementById("second-container").innerHTML).toBe(
        "<p>Second</p>",
      );
    });

    it("should handle failure of one component and set success to false", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: async () => "<div>Ok</div>",
        })
        .mockRejectedValueOnce(new Error("Fail"));

      const components = [
        { elementId: "test-container", filePath: "ok.html" },
        { elementId: "test-container", filePath: "fail.html" },
      ];

      const results = await loadComponents(components);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe("injectComponent", () => {
    it("should inject HTML into selector with default position 'afterbegin'", async () => {
      document.body.innerHTML = '<div id="target"></div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<p>Injected</p>",
      });

      injectComponent("#target", "test.html");
      await waitForPromises();

      const target = document.querySelector("#target");
      expect(target.innerHTML).toContain("<p>Injected</p>");
      expect(console.log).toHaveBeenCalledWith("Injected: test.html");
    });

    it("should inject HTML with custom position (e.g., 'beforeend')", async () => {
      document.body.innerHTML = '<div id="target">Existing</div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<p>Injected</p>",
      });

      injectComponent("#target", "test.html", "beforeend");
      await waitForPromises();

      const target = document.querySelector("#target");
      expect(target.innerHTML).toBe("Existing<p>Injected</p>");
      expect(console.log).toHaveBeenCalledWith("Injected: test.html");
    });

    it("should handle response not ok (HTTP error)", async () => {
      document.body.innerHTML = '<div id="target"></div>';
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      injectComponent("#target", "test.html");
      await waitForPromises();

      expect(console.error).toHaveBeenCalledWith(
        "Error injecting component:",
        expect.any(Error),
      );
      const error = console.error.mock.calls[0][1];
      expect(error.message).toBe("HTTP 500");
    });

    it("should handle selector not found", async () => {
      document.body.innerHTML = "";
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<p>Injected</p>",
      });

      injectComponent("#non-existent", "test.html");
      await waitForPromises();

      expect(console.warn).toHaveBeenCalledWith(
        "Selector not found: #non-existent",
      );
      expect(console.log).not.toHaveBeenCalled();
    });

    it("should handle fetch reject (network error)", async () => {
      document.body.innerHTML = '<div id="target"></div>';
      global.fetch.mockRejectedValue(new Error("Network down"));

      injectComponent("#target", "test.html");
      await waitForPromises();

      expect(console.error).toHaveBeenCalledWith(
        "Error injecting component:",
        expect.any(Error),
      );
    });

    it("should construct correct URL with basePath", async () => {
      window.location.pathname = "/pages/subfolder/";
      document.body.innerHTML = '<div id="target"></div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<p>Injected</p>",
      });

      injectComponent("#target", "./test.html");
      await waitForPromises();

      expect(global.fetch).toHaveBeenCalledWith("/pages/subfolder/test.html");
    });

    it("should handle filePath without ./ prefix", async () => {
      window.location.pathname = "/";
      document.body.innerHTML = '<div id="target"></div>';
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => "<p>Injected</p>",
      });

      injectComponent("#target", "test.html");
      await waitForPromises();

      expect(global.fetch).toHaveBeenCalledWith("/test.html");
    });
  });
});
