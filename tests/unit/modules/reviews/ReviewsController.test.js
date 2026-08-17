import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReviewsController } from "../../../../src/modules/reviews/ReviewsController.js";
import { ReviewsService } from "../../../../src/modules/reviews/ReviewsService.js";

describe("ReviewsController", () => {
  let controller;
  let mockServiceInstance;

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb) => cb());

    document.body.innerHTML = `
      <div id="reviews-grid"></div>
      <span id="avg-rating">0/5</span>
      <span id="total-reviews">(0 reviews)</span>
      <form id="review-form">
        <input id="review-name" value="">
        <input id="review-email" value="">
        <textarea id="review-content"></textarea>
        <div id="star-rating">
          <i class="star-rating" data-value="1"></i>
          <i class="star-rating" data-value="2"></i>
          <i class="star-rating" data-value="3"></i>
          <i class="star-rating" data-value="4"></i>
          <i class="star-rating" data-value="5"></i>
        </div>
        <span id="selected-rating">0/5</span>
        <button type="submit">Submit</button>
      </form>
    `;

    window.toast = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    mockServiceInstance = {
      getAll: vi.fn().mockReturnValue([]),
      getLatest: vi.fn().mockReturnValue([]),
      getStats: vi.fn().mockReturnValue({ total: 0, averageDisplay: "0/5" }),
      getAvatarColor: vi.fn().mockReturnValue("bg-blue-500"),
      getInitials: vi.fn().mockReturnValue("JD"),
      escapeHtml: vi.fn().mockImplementation((text) => text),
      formatDate: vi.fn().mockReturnValue("Today"),
      renderStars: vi.fn().mockReturnValue("★★★★★"),
      add: vi.fn(),
    };

    vi.spyOn(ReviewsService.prototype, "getAll").mockImplementation(
      mockServiceInstance.getAll,
    );
    vi.spyOn(ReviewsService.prototype, "getLatest").mockImplementation(
      mockServiceInstance.getLatest,
    );
    vi.spyOn(ReviewsService.prototype, "getStats").mockImplementation(
      mockServiceInstance.getStats,
    );
    vi.spyOn(ReviewsService.prototype, "getAvatarColor").mockImplementation(
      mockServiceInstance.getAvatarColor,
    );
    vi.spyOn(ReviewsService.prototype, "getInitials").mockImplementation(
      mockServiceInstance.getInitials,
    );
    vi.spyOn(ReviewsService.prototype, "escapeHtml").mockImplementation(
      mockServiceInstance.escapeHtml,
    );
    vi.spyOn(ReviewsService.prototype, "formatDate").mockImplementation(
      mockServiceInstance.formatDate,
    );
    vi.spyOn(ReviewsService.prototype, "renderStars").mockImplementation(
      mockServiceInstance.renderStars,
    );
    vi.spyOn(ReviewsService.prototype, "add").mockImplementation(
      mockServiceInstance.add,
    );

    controller = new ReviewsController();
    controller.service = {
      getAll: mockServiceInstance.getAll,
      getLatest: mockServiceInstance.getLatest,
      getStats: mockServiceInstance.getStats,
      getAvatarColor: mockServiceInstance.getAvatarColor,
      getInitials: mockServiceInstance.getInitials,
      escapeHtml: mockServiceInstance.escapeHtml,
      formatDate: mockServiceInstance.formatDate,
      renderStars: mockServiceInstance.renderStars,
      add: mockServiceInstance.add,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.toast;
    document.body.innerHTML = "";
  });

  describe("constructor and initialization", () => {
    it("should initialize service, starRatingRenderer, and call setup & render", () => {
      expect(controller.service).toBeDefined();
      expect(controller.starRatingRenderer).toBeDefined();
      expect(mockServiceInstance.getAll).toHaveBeenCalled();
    });
  });

  describe("render", () => {
    it("should call renderReviews and updateStats with reviews from service", () => {
      const mockReviews = [{ id: "1", name: "John", content: "Great" }];
      mockServiceInstance.getAll.mockReturnValue(mockReviews);
      const renderReviewsSpy = vi.spyOn(controller, "renderReviews");
      const updateStatsSpy = vi.spyOn(controller, "updateStats");

      controller.render();

      expect(renderReviewsSpy).toHaveBeenCalledWith(mockReviews);
      expect(updateStatsSpy).toHaveBeenCalledWith(mockReviews);
    });
  });

  describe("renderReviews", () => {
    it("should render reviews when there are reviews", () => {
      const mockReviews = [
        {
          id: "1",
          name: "John",
          content: "Great",
          rating: 5,
          createdAt: new Date().toISOString(),
        },
      ];
      mockServiceInstance.getAll.mockReturnValue(mockReviews);
      mockServiceInstance.getLatest.mockReturnValue(mockReviews);
      controller.renderReviews(mockReviews);

      const grid = document.getElementById("reviews-grid");
      expect(grid.innerHTML).toContain("John");
      expect(grid.innerHTML).toContain("Great");
      expect(grid.innerHTML).toContain("★★★★★");
      expect(mockServiceInstance.getLatest).toHaveBeenCalledWith(3);
    });

    it("should hit empty state and execute return statement (lines 80-81)", () => {
      controller.renderReviews([]);
      const grid = document.getElementById("reviews-grid");
      expect(grid.innerHTML).toContain("No reviews yet");
    });

    it("should return early if reviews-grid element is missing", () => {
      document.getElementById("reviews-grid")?.remove();
      expect(() => controller.renderReviews([])).not.toThrow();
    });
  });

  describe("updateStats", () => {
    it("should update avg-rating and total-reviews elements", () => {
      mockServiceInstance.getStats.mockReturnValue({ total: 10, averageDisplay: "4.5/5" });
      controller.updateStats([]);
      expect(document.getElementById("avg-rating").textContent).toBe("4.5/5");
      expect(document.getElementById("total-reviews").textContent).toBe("(10 reviews)");
    });

    it("should handle missing avg-rating element", () => {
      document.getElementById("avg-rating")?.remove();
      mockServiceInstance.getStats.mockReturnValue({ total: 5, averageDisplay: "3.2/5" });
      expect(() => controller.updateStats([])).not.toThrow();
      expect(document.getElementById("total-reviews").textContent).toBe("(5 reviews)");
    });

    it("should handle missing total-reviews element", () => {
      document.getElementById("total-reviews")?.remove();
      mockServiceInstance.getStats.mockReturnValue({ total: 5, averageDisplay: "3.2/5" });
      expect(() => controller.updateStats([])).not.toThrow();
    });

    it("should handle both elements missing", () => {
      document.getElementById("avg-rating")?.remove();
      document.getElementById("total-reviews")?.remove();
      mockServiceInstance.getStats.mockReturnValue({ total: 5, averageDisplay: "3.2/5" });
      expect(() => controller.updateStats([])).not.toThrow();
    });
  });

  describe("setupEventListeners", () => {
    it("should attach submit event to form when it exists", () => {
      const form = document.getElementById("review-form");
      const addEventListenerSpy = vi.spyOn(form, "addEventListener");
      controller.setupEventListeners();
      expect(addEventListenerSpy).toHaveBeenCalledWith("submit", expect.any(Function));
    });

    it("should do nothing if form is missing", () => {
      document.getElementById("review-form")?.remove();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      controller.setupEventListeners();
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe("handleSubmit", () => {
    let form;
    let submitEvent;

    beforeEach(() => {
      form = document.getElementById("review-form");
      submitEvent = { target: form, preventDefault: vi.fn() };
      vi.spyOn(controller.starRatingRenderer, "getRating").mockReturnValue(5);
    });

    it("should handle valid submission", () => {
      const nameInput = document.getElementById("review-name");
      const emailInput = document.getElementById("review-email");
      const contentInput = document.getElementById("review-content");

      nameInput.value = "Alice";
      emailInput.value = "alice@example.com";
      contentInput.value = "Good product";

      const renderSpy = vi.spyOn(controller, "render");
      const resetSpy = vi.spyOn(controller.starRatingRenderer, "reset");
      const showToastSpy = vi.spyOn(controller, "showToast");

      controller.handleSubmit(submitEvent);

      expect(mockServiceInstance.add).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
        content: "Good product",
        rating: 5,
      });
      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
      expect(contentInput.value).toBe("");
      expect(resetSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
      expect(showToastSpy).toHaveBeenCalledWith(
        "Review submitted successfully! Thank you for your feedback.",
        "success",
      );
    });

    it("should handle email empty (default to empty string)", () => {
      document.getElementById("review-name").value = "Bob";
      document.getElementById("review-email").value = "";
      document.getElementById("review-content").value = "Nice";
      controller.handleSubmit(submitEvent);
      expect(mockServiceInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({ email: "" }),
      );
    });

    it("should show warning and return if name is missing", () => {
      document.getElementById("review-name").value = "";
      document.getElementById("review-content").value = "Good";
      const showToastSpy = vi.spyOn(controller, "showToast");
      controller.handleSubmit(submitEvent);
      expect(showToastSpy).toHaveBeenCalledWith("Please enter your name.", "warning");
      expect(mockServiceInstance.add).not.toHaveBeenCalled();
    });

    it("should show warning and return if content is missing", () => {
      document.getElementById("review-name").value = "Alice";
      document.getElementById("review-content").value = "";
      const showToastSpy = vi.spyOn(controller, "showToast");
      controller.handleSubmit(submitEvent);
      expect(showToastSpy).toHaveBeenCalledWith("Please write your review.", "warning");
      expect(mockServiceInstance.add).not.toHaveBeenCalled();
    });

    it("should show warning and return if rating is 0", () => {
      controller.starRatingRenderer.getRating.mockReturnValue(0);
      document.getElementById("review-name").value = "Alice";
      document.getElementById("review-content").value = "Good";
      const showToastSpy = vi.spyOn(controller, "showToast");
      controller.handleSubmit(submitEvent);
      expect(showToastSpy).toHaveBeenCalledWith("Please select a rating.", "warning");
      expect(mockServiceInstance.add).not.toHaveBeenCalled();
    });
  });

  describe("showToast", () => {
    describe("when window.toast is available", () => {
      it("should call window.toast with correct type and title", () => {
        controller.showToast("Test message", "success");
        expect(window.toast.success).toHaveBeenCalledWith("Success", "Test message");

        controller.showToast("Warning message", "warning");
        expect(window.toast.warning).toHaveBeenCalledWith("Warning", "Warning message");

        controller.showToast("Error message", "error");
        expect(window.toast.error).toHaveBeenCalledWith("Error", "Error message");

        controller.showToast("Info message", "info");
        expect(window.toast.info).toHaveBeenCalledWith("Info", "Info message");
      });

      it("should fallback to 'info' for unknown type", () => {
        controller.showToast("Unknown", "unknown");
        expect(window.toast.info).toHaveBeenCalledWith("Info", "Unknown");
      });
    });

    describe("when window.toast is not available (fallback)", () => {
      let createElementSpy;
      let appendChildSpy;

      beforeEach(() => {
        delete window.toast;
        createElementSpy = vi.spyOn(document, "createElement");
        appendChildSpy = vi.spyOn(document.body, "appendChild");
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should create and append a toast element with correct styles for each type", () => {
        const colors = {
          success: "rgb(34, 197, 94)",
          warning: "rgb(245, 158, 11)",
          error: "rgb(239, 68, 68)",
          info: "rgb(59, 130, 246)",
        };

        const types = ["success", "warning", "error", "info"];
        types.forEach((type) => {
          controller.showToast(`Message ${type}`, type);
          expect(createElementSpy).toHaveBeenCalledWith("div");
          const toastEl = createElementSpy.mock.results[
            createElementSpy.mock.calls.length - 1
          ].value;
          expect(toastEl.style.background).toBe(colors[type]);
          expect(toastEl.textContent).toBe(`Message ${type}`);
          expect(appendChildSpy).toHaveBeenCalledWith(toastEl);
        });
      });

      it("should fallback to info color for unknown type", () => {
        controller.showToast("Unknown message", "unknown");
        const toastEl = createElementSpy.mock.results[0].value;
        expect(toastEl.style.background).toBe("rgb(59, 130, 246)");
        expect(toastEl.textContent).toBe("Unknown message");
      });

      it("should execute animation and removal callbacks", () => {
        const toastEl = document.createElement("div");
        const removeSpy = vi.spyOn(toastEl, "remove");
        createElementSpy.mockImplementation(() => toastEl);
        appendChildSpy.mockImplementation(() => {});

        controller.showToast("Test", "info");

        vi.advanceTimersByTime(3500);
        expect(toastEl.style.transform).toBe("translateY(20px)");
        expect(toastEl.style.opacity).toBe("0");

        vi.advanceTimersByTime(300);
        expect(removeSpy).toHaveBeenCalled();
      });
    });
  });
});