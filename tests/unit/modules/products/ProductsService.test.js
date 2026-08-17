import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductsService } from "../../../../src/modules/products/services/ProductsService.js";
import { Product } from "../../../../src/shared/models/index.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

describe("ProductsService", () => {
  let mockRepo;
  let mockEventBus;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn().mockReturnValue([
        new Product({ id: 1, name: "Glass Container", price: 150000 }),
        new Product({ id: 2, name: "Thermo Mug", price: 120000 }),
        new Product({ id: 3, name: "Airtight Jar", price: 80000 }),
      ]),
      findById: vi.fn(),
    };
    mockEventBus = { emit: vi.fn() };
  });

  describe("load and filtering", () => {
    it("should load products and set filteredProducts", () => {
      const service = new ProductsService(mockRepo, mockEventBus);
      service.load();
      expect(service.products).toHaveLength(3);
      expect(service.filteredProducts).toHaveLength(3);
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_LOADED, {
        count: 3,
      });
    });

    it("should filter by keyword", () => {
      const service = new ProductsService(mockRepo, mockEventBus);
      service.load();
      service.updateFilters({ keyword: "glass" });
      expect(service.filteredProducts).toHaveLength(1);
      expect(service.filteredProducts[0].id).toBe(1);
    });

    it("should filter by price range", () => {
      const service = new ProductsService(mockRepo, mockEventBus);
      service.load();
      service.updateFilters({ maxPrice: 100000 });
      expect(service.filteredProducts).toHaveLength(1);
      expect(service.filteredProducts[0].id).toBe(3);
    });
  });

  describe("sorting", () => {
    let service;
    beforeEach(() => {
      service = new ProductsService(mockRepo, mockEventBus);
      service.load();
    });

    it("should sort by price ascending", () => {
      service.updateFilters({ sort: "price-asc" });
      expect(service.filteredProducts.map((p) => p.price)).toEqual([
        80000, 120000, 150000,
      ]);
    });

    it("should sort by price descending", () => {
      service.updateFilters({ sort: "price-desc" });
      expect(service.filteredProducts.map((p) => p.price)).toEqual([
        150000, 120000, 80000,
      ]);
    });

    it("should sort by name ascending", () => {
      service.updateFilters({ sort: "name-asc" });
      expect(service.filteredProducts.map((p) => p.name)).toEqual([
        "Airtight Jar",
        "Glass Container",
        "Thermo Mug",
      ]);
    });

    it("should sort by name descending", () => {
      service.updateFilters({ sort: "name-desc" });
      expect(service.filteredProducts.map((p) => p.name)).toEqual([
        "Thermo Mug",
        "Glass Container",
        "Airtight Jar",
      ]);
    });

    it("should apply default sort (no change)", () => {
      const originalIds = service.products.map((p) => p.id);
      service.updateFilters({ sort: "default" });
      expect(service.filteredProducts.map((p) => p.id)).toEqual(originalIds);
    });
  });

  describe("pagination and loadMore", () => {
    let service;
    beforeEach(() => {
      service = new ProductsService(mockRepo, mockEventBus);
      service.load();
    });

    it("should get current page with default pageSize", () => {
      expect(service.getCurrentPage()).toHaveLength(3);
    });

    it("should return hasMore true when more products", () => {
      service.pageSize = 1;
      service.applyFilters();
      expect(service.hasMore).toBe(true);
    });

    it("should return hasMore false when no more products", () => {
      service.pageSize = 10;
      service.applyFilters();
      expect(service.hasMore).toBe(false);
    });

    it("should load more and increment page (trả về số lượng tăng dần)", () => {
      service.pageSize = 1;
      service.applyFilters();
      const first = service.getCurrentPage();
      expect(first).toHaveLength(1);
      expect(service.page).toBe(1);

      const second = service.loadMore();
      expect(service.page).toBe(2);
      expect(second).toHaveLength(2);
      expect(second[0].id).toBe(1);
      expect(second[1].id).toBe(2);
    });

    it("should return current page when hasMore is false", () => {
      service.pageSize = 10;
      service.applyFilters();
      expect(service.hasMore).toBe(false);
      const current = service.getCurrentPage();
      const result = service.loadMore();
      expect(result).toEqual(current);
      expect(service.page).toBe(1);
    });
  });

  describe("filters and reset", () => {
    let service;
    beforeEach(() => {
      service = new ProductsService(mockRepo, mockEventBus);
      service.load();
    });

    it("should update filters and emit event", () => {
      service.updateFilters({ keyword: "mug" });
      expect(service.filters.keyword).toBe("mug");
      expect(service.filteredProducts).toHaveLength(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_FILTERED, {
        total: 1,
        filters: expect.objectContaining({ keyword: "mug" }),
      });
    });

    it("should merge multiple filters", () => {
      service.updateFilters({ keyword: "Mug" });
      service.updateFilters({ maxPrice: 120000 });
      expect(service.filters.keyword).toBe("Mug");
      expect(service.filters.maxPrice).toBe(120000);
      expect(service.filteredProducts).toHaveLength(1);
    });

    it("should reset filters to default", () => {
      service.updateFilters({ keyword: "glass", maxPrice: 100000, sort: "price-asc" });
      expect(service.filters.keyword).toBe("glass");
      expect(service.filters.maxPrice).toBe(100000);
      expect(service.filters.sort).toBe("price-asc");

      service.resetFilters();
      expect(service.filters).toEqual(service.getDefaultFilters());
      expect(service.filteredProducts).toHaveLength(3);
    });
  });

  describe("getProductById", () => {
    it("should call repository.findById with id", () => {
      const service = new ProductsService(mockRepo, mockEventBus);
      const product = { id: 1 };
      mockRepo.findById.mockReturnValue(product);
      const result = service.getProductById(1);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(product);
    });
  });

  describe("updateFilters return value", () => {
    let service;
    beforeEach(() => {
      service = new ProductsService(mockRepo, mockEventBus);
      service.load();
    });

    it("should return filteredProducts from updateFilters", () => {
      const result = service.updateFilters({ keyword: "jar" });
      expect(result).toBe(service.filteredProducts);
      expect(result).toHaveLength(1);
    });

    it("should apply filters and emit event on applyFilters", () => {
      service.filters.keyword = "mug";
      const filtered = service.applyFilters();
      expect(filtered).toHaveLength(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_FILTERED, {
        total: 1,
        filters: expect.objectContaining({ keyword: "mug" }),
      });
    });
  });
});