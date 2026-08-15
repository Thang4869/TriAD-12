import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsController } from '../../../../src/modules/products/controllers/ProductsController.js';
import { ProductModel } from '../../../../src/shared/models/ProductModel.js';
import { EVENTS } from '../../../../src/shared/constants/Events.js';

describe('ProductsController', () => {
  let controller;
  let mockService;
  let mockRenderer;
  let mockEventBus;

  const mockProducts = [
    new ProductModel({ id: 1, name: 'Product A', color: 'White', price: 100000, image: 'a.jpg' }),
    new ProductModel({ id: 2, name: 'Product B', color: 'Black', price: 200000, image: 'b.jpg' })
  ];

  beforeEach(() => {
    mockService = {
      load: vi.fn(),
      getCurrentPage: vi.fn().mockReturnValue([mockProducts[0]]),
      updateFilters: vi.fn(),
      products: mockProducts,
      getProductById: vi.fn().mockImplementation(id => 
        mockProducts.find(p => p.id === id)
      ),
      loadMore: vi.fn().mockReturnValue([mockProducts[1]]),
      resetFilters: vi.fn()
    };

    mockEventBus = {
      on: vi.fn(),
      emit: vi.fn()
    };

    document.body.innerHTML = `
      <div id="search-suggestion"></div>
      <div id="product-grid"></div>
      <input id="search-input" value="">
      <select id="sort-select">
        <option value="default">Default</option>
        <option value="price-asc">Price ↑</option>
      </select>
      <input id="price-slider" type="range" min="110000" max="350000" value="350000">
      <button id="reset-filter">Reset</button>
      <div id="load-more-container"></div>
    `;
    
    mockRenderer = {
      render: vi.fn(),
      append: vi.fn(),
      searchInput: document.getElementById('search-input'),
      sortSelect: document.getElementById('sort-select'),
      priceSlider: document.getElementById('price-slider'),
      resetButton: document.getElementById('reset-filter'),
      loadMoreContainer: document.getElementById('load-more-container'),
      renderSuggestions: vi.fn(),
      updatePriceDisplay: vi.fn()
    };

    controller = new ProductsController(mockService, mockRenderer, mockEventBus);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should initialize and load products', () => {
    expect(mockService.load).toHaveBeenCalled();
  });

  it('should setup event listeners', () => {
    expect(mockEventBus.on).toHaveBeenCalledWith(
      EVENTS.PRODUCTS_FILTERED,
      expect.any(Function)
    );
  });

  it('should get product by id', () => {
    const product = controller.getProduct(1);
    expect(product).toBe(mockProducts[0]);
  });

  it('should load more products', () => {
    mockService.hasMore = true;
    controller.loadMore();
    expect(mockService.loadMore).toHaveBeenCalled();
    expect(mockRenderer.append).toHaveBeenCalled();
  });

  it('should reset filters', () => {
    controller.resetFilters();
    expect(mockService.resetFilters).toHaveBeenCalled();
  });

  it('should handle load more when service returns empty but hasMore is true', () => {
    mockService.hasMore = true;
    mockService.loadMore.mockReturnValue([]);
    controller.loadMore();
    expect(mockService.loadMore).toHaveBeenCalled();
    expect(mockRenderer.append).toHaveBeenCalledWith([]);
  });

  it('should reset filters and clear suggestion', () => {
    const suggestion = document.getElementById('search-suggestion');
    suggestion.innerHTML = '<div>test</div>';
    suggestion.classList.remove('hidden');
    controller.resetFilters();
    expect(mockService.resetFilters).toHaveBeenCalled();
    expect(mockRenderer.searchInput.value).toBe('');
    expect(mockRenderer.sortSelect.value).toBe('default');
    expect(mockRenderer.priceSlider.value).toBe('350000');
    expect(mockRenderer.updatePriceDisplay).toHaveBeenCalledWith(350000);
    expect(suggestion.classList.contains('hidden')).toBe(true);
    expect(suggestion.innerHTML).toBe('');
  });
});

describe('ProductsController - edge cases', () => {
  let mockService, mockRenderer, mockEventBus;

  beforeEach(() => {
    mockService = {
      load: vi.fn(),
      getCurrentPage: vi.fn().mockReturnValue([]),
      updateFilters: vi.fn(),
      products: [],
      getProductById: vi.fn(),
      loadMore: vi.fn(),
      resetFilters: vi.fn()
    };
    mockEventBus = { on: vi.fn(), emit: vi.fn() };
    document.body.innerHTML = `
      <div id="product-grid"></div>
      <div id="search-suggestion"></div>
    `;
    mockRenderer = {
      render: vi.fn(),
      append: vi.fn(),
      searchInput: null,
      sortSelect: null,
      priceSlider: null,
      resetButton: null,
      loadMoreContainer: null,
      renderSuggestions: vi.fn(),
      updatePriceDisplay: vi.fn()
    };
  });

  it('should handle missing search input in setupSearch', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(mockRenderer.renderSuggestions).not.toHaveBeenCalled();
  });

  it('should handle missing sort select in setupSort', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('should handle missing price slider in setupPriceFilter', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('should handle missing reset button in setupReset', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('should handle missing load more container in setupLoadMore', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('should not load more if already loading', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    controller.isLoading = true;
    controller.loadMore();
    expect(mockService.loadMore).not.toHaveBeenCalled();
  });

  it('should clear suggestion and reset UI in resetFilters', () => {
    const suggestion = document.getElementById('search-suggestion');
    suggestion.innerHTML = '<div>test</div>';
    suggestion.classList.remove('hidden');
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    controller.resetFilters();
    expect(mockService.resetFilters).toHaveBeenCalled();
    expect(suggestion.classList.contains('hidden')).toBe(true);
    expect(suggestion.innerHTML).toBe('');
  });
});

describe('ProductsController - safe handling and edge cases', () => {
  let mockService, mockRenderer, mockEventBus;
  let mockProducts;
  let controller;

  beforeEach(() => {
    mockService = {
      load: vi.fn(),
      getCurrentPage: vi.fn().mockReturnValue([]),
      updateFilters: vi.fn(),
      products: [],
      getProductById: vi.fn(),
      loadMore: vi.fn(),
      resetFilters: vi.fn()
    };
    mockEventBus = { on: vi.fn(), emit: vi.fn() };
    document.body.innerHTML = `
      <div id="product-grid"></div>
      <div id="search-suggestion"></div>
    `;
    mockRenderer = {
      render: vi.fn(),
      append: vi.fn(),
      searchInput: null,
      sortSelect: null,
      priceSlider: null,
      resetButton: null,
      loadMoreContainer: null,
      renderSuggestions: vi.fn(),
      updatePriceDisplay: vi.fn()
    };
    mockProducts = [
      new ProductModel({ id: 1, name: 'Product A', color: 'White', price: 100000, image: 'a.jpg' })
    ];
    
    window.cartController = { addToCart: vi.fn() };
    window.modalController = { open: vi.fn() };

    controller = new ProductsController(mockService, mockRenderer, mockEventBus);
  });

  it('setupSearch should safely handle missing searchInput', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
    expect(mockRenderer.renderSuggestions).not.toHaveBeenCalled();
  });

  it('setupSort should safely handle missing sortSelect', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('setupPriceFilter should safely handle missing priceSlider', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('setupReset should safely handle missing resetButton', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('setupLoadMore should safely handle missing loadMoreContainer', () => {
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    expect(controller).toBeDefined();
  });

  it('loadMore should block API call when hasMore is false', () => {
    mockService.hasMore = false;
    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    controller.loadMore();
    expect(mockService.loadMore).not.toHaveBeenCalled();
  });

  it('resetFilters should clear search input and suggestion DOM', () => {
    document.body.innerHTML += `
      <input id="search-input" value="glass">
      <div id="search-suggestion" class="not-hidden">suggestions</div>
    `;
    const searchInput = document.getElementById('search-input');
    const suggestion = document.getElementById('search-suggestion');
    mockRenderer.searchInput = searchInput;
    mockRenderer.resetButton = document.createElement('button');

    const controller = new ProductsController(mockService, mockRenderer, mockEventBus);
    controller.resetFilters();

    expect(mockService.resetFilters).toHaveBeenCalled();
    expect(searchInput.value).toBe('');
    expect(suggestion.classList.contains('hidden')).toBe(true);
    expect(suggestion.innerHTML).toBe('');
  });

  it('should handle product action add-to-cart', () => {
    const product = mockProducts[0];
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `<img src="test.jpg"><button data-action="add-to-cart" data-id="${product.id}">Add</button>`;
    document.body.appendChild(card);
    const addSpy = vi.spyOn(window.cartController, 'addToCart');
    card.querySelector('button').click();
    expect(addSpy).toHaveBeenCalledWith(product, 1, expect.any(HTMLImageElement));
  });

  it('should handle product action open-modal', () => {
    const product = mockProducts[0];
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `<div data-action="open-modal" data-id="${product.id}">Open</div>`;
    document.body.appendChild(card);
    const openSpy = vi.spyOn(window.modalController, 'open');
    card.querySelector('[data-action="open-modal"]').click();
    expect(openSpy).toHaveBeenCalledWith(product.id);
  });

  it('loadMore should not call if isLoading', () => {
    controller.isLoading = true;
    const loadMoreSpy = vi.spyOn(mockService, 'loadMore');
    controller.loadMore();
    expect(loadMoreSpy).not.toHaveBeenCalled();
  });
});