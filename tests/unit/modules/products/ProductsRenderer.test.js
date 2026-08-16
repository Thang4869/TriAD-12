import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProductsRenderer } from "../../../../src/modules/products/renderers/ProductsRenderer.js";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";
import { Logger } from "../../../../src/core/services/Logger.js";

describe("ProductsRenderer", () => {
  let renderer;
  let mockProducts;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="product-grid"></div>
      <div id="product-count">Loading...</div>
      <div id="load-more-container" class="hidden"></div>
      <input id="search-input" value="">
      <select id="sort-select"><option value="default">Featured</option></select>
      <input id="price-slider" type="range" min="110000" max="350000" value="350000">
      <span id="price-value">350.000 ₫</span>
      <button id="reset-filter">Reset</button>
      <div id="search-suggestion" class="hidden"></div>
    `;

    mockProducts = [
      new ProductModel({
        id: 1,
        name: "Container 1000ml",
        color: "White",
        price: 150000,
        image: "images/21.jpg",
        filter: "",
      }),
      new ProductModel({
        id: 2,
        name: "Container 400ml",
        color: "Black",
        price: 110000,
        image: "images/22.jpg",
        filter: "grayscale",
      }),
    ];

    renderer = new ProductsRenderer();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should initialize with correct elements", () => {
      expect(renderer.container).toBe(document.getElementById("product-grid"));
      expect(renderer.countElement).toBe(
        document.getElementById("product-count"),
      );
      expect(renderer.loadMoreContainer).toBe(
        document.getElementById("load-more-container"),
      );
      expect(renderer.searchInput).toBe(
        document.getElementById("search-input"),
      );
      expect(renderer.sortSelect).toBe(document.getElementById("sort-select"));
      expect(renderer.priceSlider).toBe(
        document.getElementById("price-slider"),
      );
      expect(renderer.priceValue).toBe(document.getElementById("price-value"));
      expect(renderer.resetButton).toBe(
        document.getElementById("reset-filter"),
      );
    });

    it("should retry finding container and eventually give up after max retries", () => {
      document.body.innerHTML = "";
      vi.useFakeTimers();
      const renderer2 = new ProductsRenderer();
      expect(renderer2.container).toBeNull();

      vi.advanceTimersByTime(100);
      expect(renderer2.container).toBeNull();

      vi.advanceTimersByTime(100);
      expect(renderer2.container).toBeNull();
      vi.advanceTimersByTime(200);
      expect(renderer2.container).toBeNull();
      vi.useRealTimers();
    });

    it("should stop retrying after max retries", () => {
      document.body.innerHTML = "";
      vi.useFakeTimers();
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const renderer2 = new ProductsRenderer();

      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(100);
      }
      expect(renderer2.container).toBeNull();
      consoleWarnSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("render", () => {
    it("should render products and update count", () => {
      renderer.render(mockProducts, 2);
      const grid = document.getElementById("product-grid");
      expect(grid.children.length).toBe(2);
      expect(grid.querySelector(".product-card")).toBeTruthy();
      expect(renderer.countElement.textContent).toBe("2 products");
      expect(renderer.loadMoreContainer.classList.contains("hidden")).toBe(
        true,
      );
    });

    it("should render empty state when products empty", () => {
      renderer.render([], 0);
      const grid = document.getElementById("product-grid");
      expect(grid.innerHTML).toContain("No products found");
      expect(renderer.countElement.textContent).toBe("0 products");
      expect(renderer.loadMoreContainer.classList.contains("hidden")).toBe(
        true,
      );
    });

    it("should handle missing container gracefully", () => {
      document.body.innerHTML = "";
      const renderer2 = new ProductsRenderer();
      const debugSpy = vi.spyOn(Logger, "debug").mockImplementation(() => {});
      renderer2.render(mockProducts);
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Product grid not found"),
      );
      debugSpy.mockRestore();
    });

    it("should show load more when totalCount greater than products length", () => {
      renderer.render(mockProducts, 10);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(false);
    });

    it("should hide load more when totalCount equals products length", () => {
      renderer.render(mockProducts, 2);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(true);
    });

    it("should handle totalCount as null/undefined (fallback to products length)", () => {
      renderer.render(mockProducts);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(true);
      expect(renderer.countElement.textContent).toBe("2 products");
    });

    it("should handle totalCount as 0 (falsy value)", () => {
      renderer.render(mockProducts, 0);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(true);
      expect(renderer.countElement.textContent).toBe("2 products");
    });
  });

  describe("append", () => {
    it("should append products to existing grid", () => {
      renderer.render([mockProducts[0]], 2);
      renderer.append([mockProducts[1]]);
      const grid = document.getElementById("product-grid");
      expect(grid.children.length).toBe(2);
      expect(renderer.loadMoreContainer.classList.contains("hidden")).toBe(
        true,
      );
    });

    it("should do nothing when products empty", () => {
      renderer.render(mockProducts, 2);
      const initialCount =
        document.getElementById("product-grid").children.length;
      renderer.append([]);
      expect(document.getElementById("product-grid").children.length).toBe(
        initialCount,
      );
    });

    it("should update load more based on dataset total", () => {
      renderer.countElement.dataset.total = "5";
      renderer.render([mockProducts[0]], 5);
      renderer.append([mockProducts[1]]);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(false);
    });

    it("should handle missing container in append gracefully", () => {
      document.body.innerHTML = "";
      const renderer2 = new ProductsRenderer();
      renderer2.container = null;
      expect(() => renderer2.append(mockProducts)).not.toThrow();
    });

    it("should handle missing dataset.total when updating load more", () => {
      renderer.render([mockProducts[0]], 5);
      renderer.countElement.dataset.total = undefined;
      renderer.append([mockProducts[1]]);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(true);
    });

    it("should handle missing countElement when updating load more", () => {
      document.body.innerHTML = `
        <div id="product-grid"></div>
        <div id="load-more-container" class="hidden"></div>
      `;
      const renderer2 = new ProductsRenderer();
      expect(renderer2.countElement).toBeNull();
      const grid = document.getElementById("product-grid");
      grid.innerHTML = '<div class="product-card"></div><div class="product-card"></div>';
      renderer2.append([mockProducts[0]]);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(true);
    });

    it("should handle dataset.total undefined when countElement exists", () => {
      renderer.render([mockProducts[0]], 5);
      renderer.countElement.dataset.total = undefined;
      renderer.append([mockProducts[1]]);
      const container = document.getElementById("load-more-container");
      expect(container.classList.contains("hidden")).toBe(true);
    });
  });

  describe("createProductCard", () => {
    it("should create a product card element with correct data", () => {
      const product = mockProducts[0];
      const card = renderer.createProductCard(product);
      expect(card).toBeInstanceOf(HTMLElement);
      expect(card.classList.contains("product-card")).toBe(true);
      expect(card.dataset.productId).toBe(String(product.id));
      expect(card.querySelector("h3").textContent).toBe(product.name);
      expect(card.querySelector(".text-2xl").textContent).toBe("150.000 ₫");
      expect(card.querySelector("img").src).toContain("21.jpg");
      expect(card.querySelector('[data-action="add-to-cart"]')).toBeTruthy();
      expect(card.querySelector('[data-action="open-modal"]')).toBeTruthy();
    });

    it("should apply filter class if present", () => {
      const product = mockProducts[1];
      const card = renderer.createProductCard(product);
      const img = card.querySelector("img");
      expect(img.className).toContain("grayscale");
    });

    it("should handle product without filter (undefined)", () => {
      const product = new ProductModel({
        id: 3,
        name: "No Filter",
        color: "Red",
        price: 100000,
        image: "test.jpg",
      });
      const card = renderer.createProductCard(product);
      const img = card.querySelector("img");
      expect(img.className).not.toContain("undefined");
      expect(img.className).toContain("product-image");
    });

    it("should return null if document is undefined (SSR safeguard)", () => {
      const originalDoc = global.document;
      delete global.document;
      const card = renderer.createProductCard(mockProducts[0]);
      expect(card).toBeNull();
      global.document = originalDoc;
    });
  });

  describe("renderEmpty", () => {
    it("should render empty state with clear filters button", () => {
      renderer.renderEmpty();
      const grid = document.getElementById("product-grid");
      expect(grid.innerHTML).toContain("No products found");
      const clearBtn = document.getElementById("clear-search-btn");
      expect(clearBtn).toBeTruthy();
    });

    it("should handle clear filters click if productsController exists", () => {
      const mockReset = vi.fn();
      window.productsController = { resetFilters: mockReset };
      renderer.renderEmpty();
      const clearBtn = document.getElementById("clear-search-btn");
      clearBtn.click();
      expect(mockReset).toHaveBeenCalled();
      delete window.productsController;
    });

    it("should handle clear filters click safely when productsController missing", () => {
      const original = window.productsController;
      delete window.productsController;
      renderer.renderEmpty();
      const clearBtn = document.getElementById("clear-search-btn");
      expect(() => clearBtn.click()).not.toThrow();
      window.productsController = original;
    });
  });

  describe("UI updates", () => {
    it("should update count element and dataset", () => {
      renderer.updateCount(10);
      expect(renderer.countElement.textContent).toBe("10 products");
      expect(renderer.countElement.dataset.total).toBe("10");
    });

    it("should show/hide load more", () => {
      renderer.updateLoadMore(true);
      expect(renderer.loadMoreContainer.classList.contains("hidden")).toBe(
        false,
      );
      renderer.updateLoadMore(false);
      expect(renderer.loadMoreContainer.classList.contains("hidden")).toBe(
        true,
      );
    });

    it("should update price display", () => {
      renderer.updatePriceDisplay(250000);
      expect(renderer.priceValue.textContent).toBe("250.000 ₫");
    });

    it("should return current UI state", () => {
      const select = document.getElementById("sort-select");
      select.innerHTML =
        '<option value="default">Default</option><option value="price-asc">Price Asc</option>';
      document.getElementById("search-input").value = "glass";
      select.value = "price-asc";
      document.getElementById("price-slider").value = "200000";
      const state = renderer.getUIState();
      expect(state).toEqual({
        keyword: "glass",
        sort: "price-asc",
        maxPrice: 200000,
      });
    });

    it("should return default UI state when inputs are empty", () => {
      document.getElementById("search-input").value = "";
      document.getElementById("sort-select").value = "default";
      document.getElementById("price-slider").value = "350000";
      const state = renderer.getUIState();
      expect(state).toEqual({
        keyword: "",
        sort: "default",
        maxPrice: 350000,
      });
    });
  });

  describe("renderSuggestions", () => {
    it("should render suggestions and handle click", () => {
      const container = document.getElementById("search-suggestion");
      const onSuggestionClick = vi.fn();
      renderer.renderSuggestions("glass", mockProducts, onSuggestionClick);
      expect(container.classList.contains("hidden")).toBe(false);
      expect(container.children.length).toBe(2);
      const firstSuggestion = container.querySelector('[data-id="1"]');
      expect(firstSuggestion.textContent).toContain("Container 1000ml");
      firstSuggestion.click();
      expect(onSuggestionClick).toHaveBeenCalledWith(1);
    });

    it("should hide suggestions when keyword empty", () => {
      const container = document.getElementById("search-suggestion");
      renderer.renderSuggestions("", mockProducts, vi.fn());
      expect(container.classList.contains("hidden")).toBe(true);
      expect(container.innerHTML).toBe("");
    });

    it("should hide suggestions when products empty", () => {
      const container = document.getElementById("search-suggestion");
      renderer.renderSuggestions("glass", [], vi.fn());
      expect(container.classList.contains("hidden")).toBe(true);
    });

    it("should hide suggestions when keyword length < 1 (edge case)", () => {
      const container = document.getElementById("search-suggestion");
      renderer.renderSuggestions("", mockProducts, vi.fn());
      expect(container.classList.contains("hidden")).toBe(true);
    });

    it("should do nothing if suggestion container not found", () => {
      document.getElementById("search-suggestion")?.remove();
      const debugSpy = vi.spyOn(Logger, "debug").mockImplementation(() => {});
      renderer.renderSuggestions("glass", mockProducts, vi.fn());
      debugSpy.mockRestore();
    });

    it("should call onSuggestionClick when a suggestion is clicked", () => {
      const onSuggestionClick = vi.fn();
      const container = document.getElementById("search-suggestion");
      renderer.renderSuggestions("glass", mockProducts, onSuggestionClick);
      const firstItem = container.querySelector('[data-id="1"]');
      firstItem.click();
      expect(onSuggestionClick).toHaveBeenCalledWith(1);
    });

    it("should handle missing onSuggestionClick gracefully", () => {
      const container = document.getElementById("search-suggestion");
      renderer.renderSuggestions("glass", mockProducts, null);
      const firstItem = container.querySelector('[data-id="1"]');
      expect(() => firstItem.click()).not.toThrow();
    });

    it("should hide suggestions when keyword is null or undefined", () => {
      const container = document.getElementById("search-suggestion");
      container.classList.remove("hidden");
      renderer.renderSuggestions(null, mockProducts, vi.fn());
      expect(container.classList.contains("hidden")).toBe(true);
      expect(container.innerHTML).toBe("");

      renderer.renderSuggestions(undefined, mockProducts, vi.fn());
      expect(container.classList.contains("hidden")).toBe(true);
      expect(container.innerHTML).toBe("");
    });
  });
});