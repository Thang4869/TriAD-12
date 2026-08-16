import { describe, it, expect, beforeEach } from "vitest";
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

  it("should initialize with no rating", () => {
    expect(renderer.getRating()).toBe(0);
    expect(document.getElementById("selected-rating").textContent).toBe("0/5");
  });

  it("should select rating on click", () => {
    const stars = document.querySelectorAll(".star-rating");
    stars[3].click(); // rating 4
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
});
