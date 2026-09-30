import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsController } from "../../../../src/modules/products/controllers/ProductsController.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

vi.mock("../../../../src/core/utils/DomUtils.js", () => ({
  DomUtils: {
    debounce: vi.fn((fn) => fn),
  },
}));

describe("ProductsController", () => {
  let controller;
  let service;
  let renderer;
  let eventBus;
  let product;

  beforeEach(() => {
    vi.clearAllMocks();

    product = {
      id: "product-1",
      name: "Product A",
      price: 100,
      matchesKeyword: vi.fn((keyword) =>
        "Product A".toLowerCase().includes(keyword.toLowerCase()),
      ),
    };

    service = {
      load: vi.fn().mockResolvedValue([product]),
      getCurrentPage: vi.fn(() => [product]),
      getProductById: vi.fn((id) => (id === "product-1" ? product : null)),
      updateFilters: vi.fn().mockResolvedValue(undefined),
      resetFilters: vi.fn().mockResolvedValue(undefined),
      loadMore: vi.fn().mockResolvedValue([]),
      products: [product],
      hasMore: true,
    };

    renderer = {
      render: vi.fn(),
      append: vi.fn(),
      renderSuggestions: vi.fn(),
      updatePriceDisplay: vi.fn(),
      renderError: vi.fn(),
      setLoading: vi.fn(),
      searchInput: null,
      sortSelect: null,
      priceSlider: null,
      resetButton: null,
      loadMoreContainer: null,
    };

    eventBus = {
      on: vi.fn(),
      emit: vi.fn(),
    };

    document.body.innerHTML = "";

    controller = new ProductsController(service, renderer, eventBus);
  });

  afterEach(() => {
    delete window.cartController;
    delete window.modalController;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("stores dependencies and initializes loading state", () => {
      expect(controller.service).toBe(service);
      expect(controller.renderer).toBe(renderer);
      expect(controller.eventBus).toBe(eventBus);
      expect(controller.isLoading).toBe(false);
    });

    it("does not load products automatically", () => {
      expect(service.load).not.toHaveBeenCalled();
    });

    it("registers product event listeners", () => {
      expect(eventBus.on).toHaveBeenCalledWith(
        EVENTS.PRODUCTS_FILTERED,
        expect.any(Function),
      );

      expect(eventBus.on).toHaveBeenCalledWith(
        EVENTS.PRODUCTS_LOADING,
        expect.any(Function),
      );
    });
  });

  describe("init", () => {
    it("loads products", async () => {
      await controller.init();

      expect(service.load).toHaveBeenCalledTimes(1);
    });

    it("renders error when initial load fails", async () => {
      const error = new Error("Load failed");
      service.load.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await controller.init();

      expect(renderer.renderError).toHaveBeenCalledWith(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load products:",
        error,
      );
    });

    it("does not fail when renderError is unavailable", async () => {
      service.load.mockRejectedValue(new Error("Load failed"));
      renderer.renderError = undefined;

      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(controller.init()).resolves.toBeUndefined();
    });
  });

  describe("product events", () => {
    it("renders current page on PRODUCTS_FILTERED", () => {
      const callback = eventBus.on.mock.calls.find(
        ([event]) => event === EVENTS.PRODUCTS_FILTERED,
      )[1];

      const items = [{ id: "product-2" }];
      service.getCurrentPage.mockReturnValue(items);

      callback({ total: 25 });

      expect(service.getCurrentPage).toHaveBeenCalled();
      expect(renderer.render).toHaveBeenCalledWith(items, 25);
    });

    it("updates loading state on PRODUCTS_LOADING", () => {
      const callback = eventBus.on.mock.calls.find(
        ([event]) => event === EVENTS.PRODUCTS_LOADING,
      )[1];

      callback({ loading: true });

      expect(renderer.setLoading).toHaveBeenCalledWith(true);
    });

    it("supports renderer without setLoading", () => {
      renderer.setLoading = undefined;

      const callback = eventBus.on.mock.calls.find(
        ([event]) => event === EVENTS.PRODUCTS_LOADING,
      )[1];

      expect(() => callback({ loading: true })).not.toThrow();
    });
  });

  describe("setupSearch", () => {
    it("updates keyword filter and renders suggestions", async () => {
      const input = document.createElement("input");
      renderer.searchInput = input;

      controller.setupSearch();

      input.value = " Product ";
      input.dispatchEvent(new Event("input"));

      expect(service.updateFilters).toHaveBeenCalledWith({
        keyword: "Product",
      });

      expect(product.matchesKeyword).toHaveBeenCalledWith("Product");

      expect(renderer.renderSuggestions).toHaveBeenCalledWith(
        "Product",
        [product],
        expect.any(Function),
      );
    });

    it("returns when search input is missing", () => {
      renderer.searchInput = null;

      controller.setupSearch();

      expect(service.updateFilters).not.toHaveBeenCalled();
    });

    it("limits suggestions to five products", () => {
      const products = Array.from({ length: 7 }, (_, index) => ({
        id: `product-${index}`,
        matchesKeyword: vi.fn(() => true),
      }));

      service.products = products;

      const input = document.createElement("input");
      renderer.searchInput = input;

      controller.setupSearch();

      input.value = "a";
      input.dispatchEvent(new Event("input"));

      const results = renderer.renderSuggestions.mock.calls[0][1];

      expect(results).toHaveLength(5);
    });

    it("selects suggestion using string product id", async () => {
      const input = document.createElement("input");
      renderer.searchInput = input;

      const suggestionContainer = document.createElement("div");
      suggestionContainer.id = "search-suggestion";
      document.body.appendChild(suggestionContainer);

      controller.setupSearch();

      input.value = "Product";
      input.dispatchEvent(new Event("input"));

      const suggestionCallback = renderer.renderSuggestions.mock.calls[0][2];

      suggestionCallback("product-1");

      expect(service.getProductById).toHaveBeenCalledWith("product-1");
      expect(service.updateFilters).toHaveBeenCalledWith({
        keyword: "Product A",
      });
      expect(input.value).toBe("Product A");
      expect(suggestionContainer.classList.contains("hidden")).toBe(true);
    });

    it("does nothing when selected suggestion product is missing", () => {
      const input = document.createElement("input");
      renderer.searchInput = input;

      service.getProductById.mockReturnValue(null);

      controller.setupSearch();

      input.value = "Product";
      input.dispatchEvent(new Event("input"));

      service.updateFilters.mockClear();

      const suggestionCallback = renderer.renderSuggestions.mock.calls[0][2];

      suggestionCallback("missing");

      expect(service.updateFilters).not.toHaveBeenCalled();
    });

    it("handles search API failure", async () => {
      const input = document.createElement("input");
      renderer.searchInput = input;

      const error = new Error("Search failed");
      service.updateFilters.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      controller.setupSearch();

      input.value = "abc";
      input.dispatchEvent(new Event("input"));

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Search failed:", error);
      });
    });
  });

  describe("setupSort", () => {
    it("updates sort filter", () => {
      const select = document.createElement("select");
      select.innerHTML = `
        <option value="default">Default</option>
        <option value="price-asc">Price</option>
      `;
      renderer.sortSelect = select;

      controller.setupSort();

      select.value = "price-asc";
      select.dispatchEvent(new Event("change"));

      expect(service.updateFilters).toHaveBeenCalledWith({
        sort: "price-asc",
      });
    });

    it("returns when sort select is missing", () => {
      renderer.sortSelect = null;

      controller.setupSort();

      expect(service.updateFilters).not.toHaveBeenCalled();
    });

    it("handles sort failure", async () => {
      const select = document.createElement("select");
      select.innerHTML = `<option value="price-asc">Price</option>`;
      renderer.sortSelect = select;

      const error = new Error("Sort failed");
      service.updateFilters.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      controller.setupSort();

      select.value = "price-asc";
      select.dispatchEvent(new Event("change"));

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Sort failed:", error);
      });
    });
  });

  describe("setupPriceFilter", () => {
    it("updates display and max price filter", () => {
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "350000";
      renderer.priceSlider = slider;

      controller.setupPriceFilter();

      slider.value = "200000";
      slider.dispatchEvent(new Event("input"));

      expect(renderer.updatePriceDisplay).toHaveBeenCalledWith(200000);
      expect(service.updateFilters).toHaveBeenCalledWith({
        maxPrice: 200000,
      });
    });

    it("returns when price slider is missing", () => {
      renderer.priceSlider = null;

      controller.setupPriceFilter();

      expect(service.updateFilters).not.toHaveBeenCalled();
    });

    it("handles price filter failure", async () => {
      const slider = document.createElement("input");
      slider.type = "range";
      renderer.priceSlider = slider;

      const error = new Error("Filter failed");
      service.updateFilters.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      controller.setupPriceFilter();

      slider.value = "100000";
      slider.dispatchEvent(new Event("input"));

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Filter failed:", error);
      });
    });
  });

  describe("setupReset", () => {
    it("calls resetFilters when clicked", () => {
      const button = document.createElement("button");
      renderer.resetButton = button;

      const resetSpy = vi
        .spyOn(controller, "resetFilters")
        .mockResolvedValue(undefined);

      controller.setupReset();

      button.click();

      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it("returns when reset button is missing", () => {
      renderer.resetButton = null;

      expect(() => controller.setupReset()).not.toThrow();
    });
  });

  describe("setupLoadMore", () => {
    it("observes load-more container", () => {
      const container = document.createElement("div");
      renderer.loadMoreContainer = container;

      const observer = {
        observe: vi.fn(),
      };

      global.IntersectionObserver = vi.fn(function () {
        return observer;
      });

      controller.setupLoadMore();

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(observer.observe).toHaveBeenCalledWith(container);
    });

    it("loads more when visible and not hidden", () => {
      const container = document.createElement("div");
      renderer.loadMoreContainer = container;

      let observerCallback;

      global.IntersectionObserver = vi.fn(function (callback) {
        observerCallback = callback;
        this.observe = vi.fn();
      });

      const loadMoreSpy = vi
        .spyOn(controller, "loadMore")
        .mockResolvedValue(undefined);

      controller.setupLoadMore();

      observerCallback([{ isIntersecting: true }]);

      expect(loadMoreSpy).toHaveBeenCalledTimes(1);
    });

    it("does not load more when container is hidden", () => {
      const container = document.createElement("div");
      container.classList.add("hidden");
      renderer.loadMoreContainer = container;

      let observerCallback;

      global.IntersectionObserver = vi.fn(function (callback) {
        observerCallback = callback;
        this.observe = vi.fn();
      });

      const loadMoreSpy = vi
        .spyOn(controller, "loadMore")
        .mockResolvedValue(undefined);

      controller.setupLoadMore();

      observerCallback([{ isIntersecting: true }]);

      expect(loadMoreSpy).not.toHaveBeenCalled();
    });

    it("returns when load-more container is missing", () => {
      renderer.loadMoreContainer = null;

      controller.setupLoadMore();

      expect(service.loadMore).not.toHaveBeenCalled();
    });

    it("loads more when button is clicked", () => {
      const container = document.createElement("div");
      const button = document.createElement("button");

      button.id = "load-more-btn";
      container.appendChild(button);
      renderer.loadMoreContainer = container;

      const loadMoreSpy = vi
        .spyOn(controller, "loadMore")
        .mockResolvedValue(undefined);

      controller.setupLoadMore();

      button.click();

      expect(loadMoreSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("setupProductActions", () => {
    it("adds product to cart using UUID string", () => {
      const card = document.createElement("div");
      card.className = "product-card";

      const image = document.createElement("img");
      card.appendChild(image);

      const button = document.createElement("button");
      button.dataset.action = "add-to-cart";
      button.dataset.id = "product-1";
      card.appendChild(button);

      document.body.appendChild(card);

      window.cartController = {
        addToCart: vi.fn(),
      };

      controller.setupProductActions();

      button.click();

      expect(service.getProductById).toHaveBeenCalledWith("product-1");
      expect(window.cartController.addToCart).toHaveBeenCalledWith(
        product,
        1,
        image,
      );
    });

    it("stops propagation when add-to-cart is clicked", () => {
      const button = document.createElement("button");
      button.dataset.action = "add-to-cart";
      button.dataset.id = "product-1";
      document.body.appendChild(button);

      window.cartController = {
        addToCart: vi.fn(),
      };

      controller.setupProductActions();

      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });

      const stopSpy = vi.spyOn(event, "stopPropagation");

      button.dispatchEvent(event);

      expect(stopSpy).toHaveBeenCalled();
    });

    it("does not add when product is missing", () => {
      const button = document.createElement("button");
      button.dataset.action = "add-to-cart";
      button.dataset.id = "missing";
      document.body.appendChild(button);

      service.getProductById.mockReturnValue(null);

      window.cartController = {
        addToCart: vi.fn(),
      };

      controller.setupProductActions();

      button.click();

      expect(window.cartController.addToCart).not.toHaveBeenCalled();
    });

    it("does not fail when cart controller is unavailable", () => {
      const button = document.createElement("button");
      button.dataset.action = "add-to-cart";
      button.dataset.id = "product-1";
      document.body.appendChild(button);

      delete window.cartController;

      controller.setupProductActions();

      expect(() => button.click()).not.toThrow();
    });

    it("opens modal using UUID string", () => {
      const button = document.createElement("button");
      button.dataset.action = "open-modal";
      button.dataset.id = "product-1";
      document.body.appendChild(button);

      window.modalController = {
        open: vi.fn(),
      };

      controller.setupProductActions();

      button.click();

      expect(window.modalController.open).toHaveBeenCalledWith("product-1");
    });

    it("does not fail when modal controller is unavailable", () => {
      const button = document.createElement("button");
      button.dataset.action = "open-modal";
      button.dataset.id = "product-1";
      document.body.appendChild(button);

      delete window.modalController;

      controller.setupProductActions();

      expect(() => button.click()).not.toThrow();
    });

    it("ignores clicks without data-action", () => {
      const button = document.createElement("button");
      document.body.appendChild(button);

      window.cartController = {
        addToCart: vi.fn(),
      };

      controller.setupProductActions();

      button.click();

      expect(window.cartController.addToCart).not.toHaveBeenCalled();
    });
  });

  describe("loadMore", () => {
    it("returns when already loading", async () => {
      controller.isLoading = true;

      await controller.loadMore();

      expect(service.loadMore).not.toHaveBeenCalled();
    });

    it("returns when there are no more products", async () => {
      service.hasMore = false;

      await controller.loadMore();

      expect(service.loadMore).not.toHaveBeenCalled();
    });

    it("loads and appends more products", async () => {
      const newItems = [{ id: "product-2" }];

      service.loadMore.mockResolvedValue(newItems);

      await controller.loadMore();

      expect(service.loadMore).toHaveBeenCalledTimes(1);
      expect(renderer.append).toHaveBeenCalledWith(newItems);
      expect(controller.isLoading).toBe(false);
    });

    it("sets loading while request is pending", async () => {
      let resolveLoad;

      service.loadMore.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLoad = resolve;
          }),
      );

      const promise = controller.loadMore();

      expect(controller.isLoading).toBe(true);

      resolveLoad([]);

      await promise;

      expect(controller.isLoading).toBe(false);
    });

    it("handles load-more failure and resets loading state", async () => {
      const error = new Error("Load more failed");

      service.loadMore.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await controller.loadMore();

      expect(consoleSpy).toHaveBeenCalledWith("Load more failed:", error);
      expect(renderer.append).not.toHaveBeenCalled();
      expect(controller.isLoading).toBe(false);
    });
  });

  describe("resetFilters", () => {
    it("resets UI and service filters", async () => {
      const searchInput = document.createElement("input");
      const sortSelect = document.createElement("select");
      const priceSlider = document.createElement("input");

      sortSelect.innerHTML = `
        <option value="default">Default</option>
        <option value="price-asc">Price</option>
      `;

      searchInput.value = "abc";
      sortSelect.value = "price-asc";
      priceSlider.value = "100000";

      renderer.searchInput = searchInput;
      renderer.sortSelect = sortSelect;
      renderer.priceSlider = priceSlider;

      const suggestions = document.createElement("div");
      suggestions.id = "search-suggestion";
      suggestions.innerHTML = "old";
      document.body.appendChild(suggestions);

      await controller.resetFilters();

      expect(searchInput.value).toBe("");
      expect(sortSelect.value).toBe("default");
      expect(priceSlider.value).toBe("350000");
      expect(renderer.updatePriceDisplay).toHaveBeenCalledWith(350000);
      expect(suggestions.classList.contains("hidden")).toBe(true);
      expect(suggestions.innerHTML).toBe("");
      expect(service.resetFilters).toHaveBeenCalledTimes(1);
    });

    it("works when optional UI elements are missing", async () => {
      renderer.searchInput = null;
      renderer.sortSelect = null;
      renderer.priceSlider = null;

      await expect(controller.resetFilters()).resolves.toBeUndefined();

      expect(service.resetFilters).toHaveBeenCalledTimes(1);
    });

    it("handles reset failure", async () => {
      const error = new Error("Reset failed");
      service.resetFilters.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await controller.resetFilters();

      expect(consoleSpy).toHaveBeenCalledWith("Reset filters failed:", error);
    });
  });

  describe("getProduct", () => {
    it("gets product using UUID string", () => {
      const result = controller.getProduct("product-1");

      expect(result).toBe(product);
      expect(service.getProductById).toHaveBeenCalledWith("product-1");
    });

    it("returns null when product does not exist", () => {
      service.getProductById.mockReturnValue(null);

      expect(controller.getProduct("missing")).toBeNull();
    });
  });
});
