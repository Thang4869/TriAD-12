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

    mockRenderer = {
      render: vi.fn(),
      append: vi.fn(),
      searchInput: document.createElement('input'),
      sortSelect: document.createElement('select'),
      priceSlider: document.createElement('input'),
      resetButton: document.createElement('button'),
      loadMoreContainer: document.createElement('div'),
      renderSuggestions: vi.fn(),
      updatePriceDisplay: vi.fn()
    };

    mockEventBus = {
      on: vi.fn(),
      emit: vi.fn()
    };

    document.body.innerHTML = `
      <div id="search-suggestion"></div>
      <div id="product-grid"></div>
    `;

    controller = new ProductsController(mockService, mockRenderer, mockEventBus);
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
    controller.loadMore();
    expect(mockService.loadMore).toHaveBeenCalled();
    expect(mockRenderer.append).toHaveBeenCalled();
  });

  it('should reset filters', () => {
    controller.resetFilters();
    expect(mockService.resetFilters).toHaveBeenCalled();
  });
});