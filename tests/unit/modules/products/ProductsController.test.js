import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProductsController } from "../../../../src/modules/products/controllers/ProductsController.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";
import { DomUtils } from "../../../../src/core/utils/DomUtils.js";

vi.mock("../../../../src/core/utils/DomUtils.js", () => ({
  DomUtils: {
    debounce: vi.fn((fn) => fn),
  },
}));

describe("ProductsController", () => {
  let controller;
  let serviceMock;
  let rendererMock;
  let eventBusMock;
  let mockProduct;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProduct = {
      id: 1,
      name: "Product A",
      price: 100,
      matchesKeyword: vi.fn(),
    };

    serviceMock = {
      load: vi.fn(),
      getCurrentPage: vi.fn(() => [mockProduct]),
      getProductById: vi.fn((id) => (id === 1 ? mockProduct : null)),
      updateFilters: vi.fn(),
      resetFilters: vi.fn(),
      hasMore: true,
      loadMore: vi.fn(() => [mockProduct]),
      products: [mockProduct],
    };

    rendererMock = {
      render: vi.fn(),
      append: vi.fn(),
      renderSuggestions: vi.fn(),
      updatePriceDisplay: vi.fn(),
      searchInput: null,
      sortSelect: null,
      priceSlider: null,
      resetButton: null,
      loadMoreContainer: null,
    };

    eventBusMock = {
      on: vi.fn(),
      emit: vi.fn(),
    };

    global.document.querySelector = vi.fn();
    global.document.getElementById = vi.fn();
    global.document.addEventListener = vi.fn();

    controller = new ProductsController(
      serviceMock,
      rendererMock,
      eventBusMock,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor & Initialization", () => {
    it("should initialize with service, renderer, and eventBus", () => {
      expect(controller.service).toBe(serviceMock);
      expect(controller.renderer).toBe(rendererMock);
      expect(controller.eventBus).toBe(eventBusMock);
      expect(controller.isLoading).toBe(false);
    });

    it("should call service.load() on construction", () => {
      expect(serviceMock.load).toHaveBeenCalledTimes(1);
    });
  });

  describe("Event Listeners Setup", () => {
    it("should listen to PRODUCTS_FILTERED event", () => {
      expect(eventBusMock.on).toHaveBeenCalledWith(
        EVENTS.PRODUCTS_FILTERED,
        expect.any(Function),
      );
    });

    describe("setupSearch", () => {
      it("should register input event with debounce and render suggestions", () => {
        const input = document.createElement("input");
        rendererMock.searchInput = input;
        const addEventListenerSpy = vi.spyOn(input, "addEventListener");

        controller.setupSearch();

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "input",
          expect.any(Function),
        );
        const handler = addEventListenerSpy.mock.calls[0][1];
        const mockEvent = { target: { value: "abc" } };
        handler(mockEvent);

        expect(serviceMock.updateFilters).toHaveBeenCalledWith({
          keyword: "abc",
        });
        expect(rendererMock.renderSuggestions).toHaveBeenCalledWith(
          "abc",
          expect.any(Array),
          expect.any(Function),
        );
      });

      it("should return early if searchInput not found", () => {
        rendererMock.searchInput = null;
        controller.setupSearch();
        expect(serviceMock.updateFilters).not.toHaveBeenCalled();
      });

      it("should handle suggestion click and update filter", () => {
        const input = document.createElement("input");
        rendererMock.searchInput = input;
        const addEventListenerSpy = vi.spyOn(input, "addEventListener");
        controller.setupSearch();

        const handler = addEventListenerSpy.mock.calls[0][1];
        handler({ target: { value: "pro" } });

        const renderSuggestionsCall =
          rendererMock.renderSuggestions.mock.calls[0];
        const suggestionCallback = renderSuggestionsCall[2];

        const productMock = { id: 2, name: "Product B" };
        serviceMock.getProductById = vi.fn((id) =>
          id === 2 ? productMock : null,
        );
        const suggestionContainer = document.createElement("div");
        suggestionContainer.classList.add = vi.fn();
        document.getElementById.mockReturnValue(suggestionContainer);

        suggestionCallback(2);

        expect(serviceMock.updateFilters).toHaveBeenCalledWith({
          keyword: productMock.name,
        });
        expect(rendererMock.searchInput.value).toBe(productMock.name);
        expect(suggestionContainer.classList.add).toHaveBeenCalledWith(
          "hidden",
        );
      });
    });

    describe("setupSort", () => {
      it("should register change event on sort select", () => {
        const select = document.createElement("select");
        rendererMock.sortSelect = select;
        const addEventListenerSpy = vi.spyOn(select, "addEventListener");

        controller.setupSort();

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "change",
          expect.any(Function),
        );
        const handler = addEventListenerSpy.mock.calls[0][1];
        handler({ target: { value: "price-asc" } });

        expect(serviceMock.updateFilters).toHaveBeenCalledWith({
          sort: "price-asc",
        });
      });

      it("should return early if sortSelect not found", () => {
        rendererMock.sortSelect = null;
        controller.setupSort();
        expect(serviceMock.updateFilters).not.toHaveBeenCalled();
      });
    });

    describe("setupPriceFilter", () => {
      it("should register input event on price slider and update display", () => {
        const slider = document.createElement("input");
        slider.type = "range";
        rendererMock.priceSlider = slider;
        const addEventListenerSpy = vi.spyOn(slider, "addEventListener");

        controller.setupPriceFilter();

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "input",
          expect.any(Function),
        );
        const handler = addEventListenerSpy.mock.calls[0][1];
        handler({ target: { value: "200000" } });

        expect(rendererMock.updatePriceDisplay).toHaveBeenCalledWith(200000);
        expect(serviceMock.updateFilters).toHaveBeenCalledWith({
          maxPrice: 200000,
        });
      });

      it("should return early if priceSlider not found", () => {
        rendererMock.priceSlider = null;
        controller.setupPriceFilter();
        expect(serviceMock.updateFilters).not.toHaveBeenCalled();
      });
    });

    describe("setupReset", () => {
      it("should register click event on reset button", () => {
        const button = document.createElement("button");
        rendererMock.resetButton = button;
        const addEventListenerSpy = vi.spyOn(button, "addEventListener");
        const resetFiltersSpy = vi.spyOn(controller, "resetFilters");

        controller.setupReset();

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "click",
          expect.any(Function),
        );
        const handler = addEventListenerSpy.mock.calls[0][1];
        handler();

        expect(resetFiltersSpy).toHaveBeenCalled();
      });

      it("should return early if resetButton not found", () => {
        rendererMock.resetButton = null;
        expect(() => controller.setupReset()).not.toThrow();
        expect(serviceMock.resetFilters).not.toHaveBeenCalled();
      });
    });

    describe("setupLoadMore", () => {
      it("should create IntersectionObserver and observe container", () => {
        const container = document.createElement("div");
        rendererMock.loadMoreContainer = container;
        const mockObserver = { observe: vi.fn() };
        global.IntersectionObserver = vi.fn((callback) => {
          mockObserver.callback = callback;
          return mockObserver;
        });

        controller.setupLoadMore();

        expect(global.IntersectionObserver).toHaveBeenCalled();
        expect(mockObserver.observe).toHaveBeenCalledWith(container);

        const loadMoreSpy = vi.spyOn(controller, "loadMore");
        mockObserver.callback([{ isIntersecting: true }]);
        expect(loadMoreSpy).toHaveBeenCalled();
      });

      it("should return early if loadMoreContainer not found", () => {
        rendererMock.loadMoreContainer = null;
        global.IntersectionObserver = vi.fn();
        controller.setupLoadMore();
        expect(global.IntersectionObserver).not.toHaveBeenCalled();
      });

      it("should attach click event to load-more-btn if exists", () => {
        const container = document.createElement("div");
        const button = document.createElement("button");
        button.id = "load-more-btn";
        container.appendChild(button);
        rendererMock.loadMoreContainer = container;

        const mockObserver = { observe: vi.fn() };
        global.IntersectionObserver = vi.fn(() => mockObserver);

        const addEventListenerSpy = vi.spyOn(button, "addEventListener");

        controller.setupLoadMore();

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "click",
          expect.any(Function),
        );
        const handler = addEventListenerSpy.mock.calls[0][1];
        const loadMoreSpy = vi.spyOn(controller, "loadMore");
        handler();
        expect(loadMoreSpy).toHaveBeenCalled();
      });
    });

    describe("setupProductActions", () => {
      it("should handle add-to-cart click", () => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";
        const img = document.createElement("img");
        img.src = "test.jpg";
        productCard.appendChild(img);
        const button = document.createElement("button");
        button.dataset.action = "add-to-cart";
        button.dataset.id = "1";
        productCard.appendChild(button);

        document.querySelector = vi.fn((selector) => {
          if (selector === ".product-card") return productCard;
          return null;
        });

        document.addEventListener = vi.fn((event, handler) => {
          if (event === "click") {
            const mockEvent = { target: button, stopPropagation: vi.fn() };
            handler(mockEvent);
          }
        });

        window.cartController = { addToCart: vi.fn() };
        controller.setupProductActions();

        const clickHandler = document.addEventListener.mock.calls.find(
          (c) => c[0] === "click",
        )[1];
        const mockEvent = { target: button, stopPropagation: vi.fn() };
        clickHandler(mockEvent);

        expect(window.cartController.addToCart).toHaveBeenCalledWith(
          mockProduct,
          1,
          img,
        );
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      });

      it("should handle open-modal click", () => {
        const button = document.createElement("button");
        button.dataset.action = "open-modal";
        button.dataset.id = "1";
        document.addEventListener = vi.fn((event, handler) => {
          if (event === "click") {
            const mockEvent = { target: button };
            handler(mockEvent);
          }
        });

        window.modalController = { open: vi.fn() };
        controller.setupProductActions();

        const clickHandler = document.addEventListener.mock.calls.find(
          (c) => c[0] === "click",
        )[1];
        clickHandler({ target: button });

        expect(window.modalController.open).toHaveBeenCalledWith(1);
      });

      it("should return early if target not found", () => {
        document.addEventListener = vi.fn((event, handler) => {
          if (event === "click") {
            handler({ target: document.createElement("div") });
          }
        });
        controller.setupProductActions();

        const clickHandler = document.addEventListener.mock.calls.find(
          (c) => c[0] === "click",
        )[1];
        clickHandler({ target: document.createElement("div") });

        expect(window.cartController?.addToCart).not.toHaveBeenCalled();
        expect(window.modalController?.open).not.toHaveBeenCalled();
      });

      it("should not throw error if window.cartController is undefined", () => {
        const button = document.createElement("button");
        button.dataset.action = "add-to-cart";
        button.dataset.id = "1";
        document.addEventListener = vi.fn((event, handler) => {
          if (event === "click") {
            handler({ target: button, stopPropagation: vi.fn() });
          }
        });

        delete window.cartController;
        controller.setupProductActions();

        const clickHandler = document.addEventListener.mock.calls.find(
          (c) => c[0] === "click",
        )[1];
        expect(() =>
          clickHandler({ target: button, stopPropagation: vi.fn() }),
        ).not.toThrow();
      });

      it("should not throw error if window.modalController is undefined", () => {
        const button = document.createElement("button");
        button.dataset.action = "open-modal";
        button.dataset.id = "1";
        document.addEventListener = vi.fn((event, handler) => {
          if (event === "click") {
            handler({ target: button });
          }
        });

        delete window.modalController;
        controller.setupProductActions();

        const clickHandler = document.addEventListener.mock.calls.find(
          (c) => c[0] === "click",
        )[1];
        expect(() => clickHandler({ target: button })).not.toThrow();
      });

      it("should handle add-to-cart with product not found", () => {
        const button = document.createElement("button");
        button.dataset.action = "add-to-cart";
        button.dataset.id = "999";
        document.addEventListener = vi.fn((event, handler) => {
          if (event === "click") {
            handler({ target: button, stopPropagation: vi.fn() });
          }
        });

        window.cartController = { addToCart: vi.fn() };
        controller.setupProductActions();

        const clickHandler = document.addEventListener.mock.calls.find(
          (c) => c[0] === "click",
        )[1];
        clickHandler({ target: button, stopPropagation: vi.fn() });

        expect(window.cartController.addToCart).not.toHaveBeenCalled();
      });
    });
  });

  describe("loadMore", () => {
    it("should not load if isLoading is true", () => {
      controller.isLoading = true;
      serviceMock.hasMore = true;
      const loadMoreSpy = vi.spyOn(serviceMock, "loadMore");
      controller.loadMore();
      expect(loadMoreSpy).not.toHaveBeenCalled();
      expect(rendererMock.append).not.toHaveBeenCalled();
    });

    it("should not load if hasMore is false", () => {
      controller.isLoading = false;
      serviceMock.hasMore = false;
      const loadMoreSpy = vi.spyOn(serviceMock, "loadMore");
      controller.loadMore();
      expect(loadMoreSpy).not.toHaveBeenCalled();
      expect(rendererMock.append).not.toHaveBeenCalled();
    });

    it("should load more products and append to renderer", () => {
      controller.isLoading = false;
      serviceMock.hasMore = true;
      const newProducts = [{ id: 2, name: "Product B" }];
      serviceMock.loadMore = vi.fn(() => newProducts);

      controller.loadMore();

      expect(serviceMock.loadMore).toHaveBeenCalled();
      expect(rendererMock.append).toHaveBeenCalledWith(newProducts);
      expect(controller.isLoading).toBe(true);
    });
  });

  describe("resetFilters", () => {
    it("should call service.resetFilters and reset UI elements", () => {
      const searchInput = { value: "abc" };
      const sortSelect = { value: "price-asc" };
      const priceSlider = { value: "100" };
      const suggestionContainer = {
        classList: { add: vi.fn() },
        innerHTML: "old content",
      };

      rendererMock.searchInput = searchInput;
      rendererMock.sortSelect = sortSelect;
      rendererMock.priceSlider = priceSlider;
      rendererMock.updatePriceDisplay = vi.fn();

      document.getElementById.mockReturnValue(suggestionContainer);

      controller.resetFilters();

      expect(serviceMock.resetFilters).toHaveBeenCalled();
      expect(searchInput.value).toBe("");
      expect(sortSelect.value).toBe("default");
      expect(priceSlider.value).toBe(350000);
      expect(rendererMock.updatePriceDisplay).toHaveBeenCalledWith(350000);
      expect(suggestionContainer.classList.add).toHaveBeenCalledWith("hidden");
      expect(suggestionContainer.innerHTML).toBe("");
    });

    it("should handle missing UI elements gracefully", () => {
      rendererMock.searchInput = null;
      rendererMock.sortSelect = null;
      rendererMock.priceSlider = null;
      document.getElementById.mockReturnValue(null);

      expect(() => controller.resetFilters()).not.toThrow();
      expect(serviceMock.resetFilters).toHaveBeenCalled();
    });
  });

  describe("getProduct", () => {
    it("should return product by id", () => {
      const product = controller.getProduct(1);
      expect(product).toBe(mockProduct);
      expect(serviceMock.getProductById).toHaveBeenCalledWith(1);
    });

    it("should return null if product not found", () => {
      serviceMock.getProductById = vi.fn(() => null);
      const result = controller.getProduct(999);
      expect(result).toBeNull();
      expect(serviceMock.getProductById).toHaveBeenCalledWith(999);
    });
  });

  describe("PRODUCTS_FILTERED event handling", () => {
    it("should render products when event is emitted", () => {
      const data = { total: 10 };
      const onFiltered = eventBusMock.on.mock.calls.find(
        (c) => c[0] === EVENTS.PRODUCTS_FILTERED,
      )[1];
      const currentPage = [{ id: 3 }];
      serviceMock.getCurrentPage = vi.fn(() => currentPage);
      onFiltered(data);
      expect(serviceMock.getCurrentPage).toHaveBeenCalled();
      expect(rendererMock.render).toHaveBeenCalledWith(currentPage, data.total);
    });
  });
});
