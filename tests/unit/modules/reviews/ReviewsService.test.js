import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewsService } from "../../../../src/modules/reviews/ReviewsService.js";

describe("ReviewsService", () => {
  let service;
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  };

  beforeEach(() => {
    global.localStorage = mockLocalStorage;
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.getItem.mockReturnValue(null);
    service = new ReviewsService();
  });

  describe("Constructor & Storage", () => {
    it("should load default empty array from storage if no data exists", () => {
      expect(service.getAll()).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
    });

    it("should load reviews from storage if data exists", () => {
      const mockData = [{ id: "1", name: "John", content: "Great", rating: 5 }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));
      service = new ReviewsService();
      expect(service.getAll()).toEqual(mockData);
    });

    it("should handle localStorage errors gracefully during load", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      service = new ReviewsService();
      expect(service.getAll()).toEqual([]);
    });

    it("should save reviews to storage", () => {
      const reviews = [{ id: "1", name: "Test", content: "Hi", rating: 5 }];
      service.save(reviews);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "triad_reviews",
        JSON.stringify(reviews)
      );
      expect(service.getAll()).toEqual(reviews);
    });
  });

  describe("CRUD Operations", () => {
    it("should add a new review", () => {
      const review = service.add({ name: "Alice", content: "Good", rating: 4 });
      expect(review.id).toBeDefined();
      expect(review.name).toBe("Alice");
      expect(service.getAll().length).toBe(1);
    });

    it("should get all reviews", () => {
      service.add({ name: "A", content: "1", rating: 5 });
      service.add({ name: "B", content: "2", rating: 4 });
      expect(service.getAll().length).toBe(2);
    });

    it("should get latest reviews in correct order", () => {
      service.add({ name: "A", content: "1", rating: 5 });
      service.add({ name: "B", content: "2", rating: 4 });
      service.add({ name: "C", content: "3", rating: 3 });
      const latest = service.getLatest(2);
      expect(latest.length).toBe(2);
      expect(latest[0].name).toBe("C");
      expect(latest[1].name).toBe("B");
    });
  });

  describe("Statistics", () => {
    it("should return empty stats when no reviews", () => {
      expect(service.getStats()).toEqual({ total: 0, average: 0, averageDisplay: "0/5" });
    });

    it("should calculate average rating correctly", () => {
      service.add({ name: "A", content: "1", rating: 5 });
      service.add({ name: "B", content: "2", rating: 4 });
      service.add({ name: "C", content: "3", rating: 3 });
      const stats = service.getStats();
      expect(stats.total).toBe(3);
      expect(stats.average).toBe(4);
      expect(stats.averageDisplay).toBe("4.0/5");
    });
  });

  describe("Utility Methods", () => {
    describe("formatDate", () => {
      it("should return 'Today' for today's date", () => {
        expect(service.formatDate(new Date().toISOString())).toBe("Today");
      });

      it("should return 'Yesterday' for yesterday's date", () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        expect(service.formatDate(d.toISOString())).toBe("Yesterday");
      });

      it("should return 'X days ago' for 2-6 days ago", () => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        expect(service.formatDate(d.toISOString())).toBe("3 days ago");
      });

      it("should return weeks ago for dates older than 7 days", () => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        expect(service.formatDate(d.toISOString())).toBe("2 weeks ago");
      });

      it("should return months ago for dates older than 30 days", () => {
        const d = new Date();
        d.setDate(d.getDate() - 45);
        expect(service.formatDate(d.toISOString())).toBe("1 months ago");
      });

      it("should return years ago for dates older than 365 days", () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 2);
        expect(service.formatDate(d.toISOString())).toBe("2 years ago");
      });
    });

    describe("getAvatarColor", () => {
      it("should return a consistent color from the predefined list", () => {
        const color = service.getAvatarColor("Alice");
        expect(color).toBe(service.getAvatarColor("Alice"));
        expect(service.getAvatarColor("")).toBeDefined();
      });
    });

    describe("getInitials", () => {
      it("should return correct initials", () => {
        expect(service.getInitials("")).toBe("");
        expect(service.getInitials("John Doe")).toBe("JD");
        expect(service.getInitials("Jane")).toBe("J");
      });
    });

    describe("escapeHtml", () => {
      it("should escape HTML entities", () => {
        expect(service.escapeHtml("<script>")).toBe("&lt;script&gt;");
        expect(service.escapeHtml(null)).toBe("");
      });
    });

    describe("generateId & renderStars", () => {
      it("should generate unique IDs", () => {
        expect(service.generateId()).not.toBe(service.generateId());
      });
      it("should return a string of stars", () => {
        expect(service.renderStars(5)).toContain("ph-star");
      });
    });
  });
});