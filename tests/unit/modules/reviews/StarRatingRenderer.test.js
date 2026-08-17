import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StarRatingRenderer } from "../../../../src/modules/reviews/StarRatingRenderer.js";

describe("StarRatingRenderer", () => {
  let renderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="star-rating">
        <i class="star-rating" data-value="1"></i>
        <i class="star-rating" data-value="2"></i>
        <i class="star-rating" data-value="3"></i>
        <i class="star-rating" data-value="4"></i>
        <i class="star-rating" data-value="5"></i>
      </div>
      <span id="selected-rating">0/5</span>
    `;
    renderer = new StarRatingRenderer("#star-rating", "#selected-rating");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("should initialize with no rating", () => {
    expect(renderer.getRating()).toBe(0);
    expect(document.getElementById("selected-rating").textContent).toBe("0/5");
  });

  it("should select rating on click", () => {
    const stars = document.querySelectorAll(".star-rating");
    stars[3].click();
    expect(renderer.getRating()).toBe(4);
    expect(document.getElementById("selected-rating").textContent).toBe("4/5");
  });

  it("should reset rating", () => {
    const stars = document.querySelectorAll(".star-rating");
    stars[2].click();
    renderer.reset();
    expect(renderer.getRating()).toBe(0);
    expect(document.getElementById("selected-rating").textContent).toBe("0/5");
  });

  it("should return early if container is not found", () => {
    document.getElementById("star-rating")?.remove();
    expect(() => {
      const newRenderer = new StarRatingRenderer("#star-rating", "#selected-rating");
      expect(newRenderer.container).toBeNull();
    }).not.toThrow();
  });

  it("should handle missing display element", () => {
    document.getElementById("selected-rating")?.remove();
    const newRenderer = new StarRatingRenderer("#star-rating", "#selected-rating");
    const stars = document.querySelectorAll(".star-rating");
    stars[0].click();
    expect(newRenderer.getRating()).toBe(1);
    expect(document.getElementById("selected-rating")).toBeNull();
  });

  it("should call _updateStars on mouseenter and mouseleave", () => {
    const stars = document.querySelectorAll(".star-rating");
    const updateSpy = vi.spyOn(renderer, "_updateStars");

    stars[0].dispatchEvent(new MouseEvent("mouseenter"));
    expect(updateSpy).toHaveBeenCalledWith(0);

    stars[0].dispatchEvent(new MouseEvent("mouseleave"));
    expect(updateSpy).toHaveBeenCalledWith(-1);

    stars[3].click();
    stars[3].dispatchEvent(new MouseEvent("mouseleave"));
    expect(updateSpy).toHaveBeenCalledWith(3);
  });
});