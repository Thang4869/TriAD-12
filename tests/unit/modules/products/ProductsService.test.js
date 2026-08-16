import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductsService } from "../../../../src/modules/products/services/ProductsService";
import { Product } from "../../../../src/shared/models/index.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

describe("ProductsService", () => {
  let mockRepo;
  let mockEventBus;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn().mockReturnValue([
        new Product({
          id: 1,
          name: "Glass Container",
          color: "White",
          price: 150000,
        }),
        new Product({
          id: 2,
          name: "Thermo Mug",
          color: "Black",
          price: 120000,
        }),
      ]),
    };
    mockEventBus = { emit: vi.fn() };
  });

  it("should filter products by keyword", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ keyword: "glass" });
    const filtered = service.getCurrentPage();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });

  it("should sort products by price ascending", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ sort: "price-asc" });
    const filtered = service.getCurrentPage();
    expect(filtered[0].price).toBe(120000);
    expect(filtered[1].price).toBe(150000);
  });

  it("should sort products by name descending", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ sort: "name-desc" });
    const filtered = service.getCurrentPage();
    expect(filtered[0].name).toBe("Thermo Mug");
    expect(filtered[1].name).toBe("Glass Container");
  });

  it("should return hasMore false when no more items", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ keyword: "glass" });
    expect(service.hasMore).toBe(false);
  });

  it("should load more only if hasMore", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({});
    const result = service.loadMore();
    expect(result.length).toBe(2);
  });
});

describe("ProductsService - additional tests", () => {
  let mockRepo, mockEventBus;

  beforeEach(() => {
    mockRepo = {
      findAll: vi
        .fn()
        .mockReturnValue([
          new Product({ id: 1, name: "Glass Container", price: 150000 }),
          new Product({ id: 2, name: "Thermo Mug", price: 120000 }),
          new Product({ id: 3, name: "Airtight Jar", price: 80000 }),
        ]),
    };
    mockEventBus = { emit: vi.fn() };
  });

  it("should apply sort by name ascending", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ sort: "name-asc" });
    const result = service.getCurrentPage();
    expect(result[0].name).toBe("Airtight Jar");
    expect(result[1].name).toBe("Glass Container");
    expect(result[2].name).toBe("Thermo Mug");
  });

  it("should apply sort by name descending", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ sort: "name-desc" });
    const result = service.getCurrentPage();
    expect(result[0].name).toBe("Thermo Mug");
    expect(result[1].name).toBe("Glass Container");
    expect(result[2].name).toBe("Airtight Jar");
  });

  it("should apply default sort (no change)", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    const original = service.products.map((p) => p.id);
    service.updateFilters({ sort: "default" });
    const result = service.getCurrentPage();
    expect(result.map((p) => p.id)).toEqual(original);
  });

  it("should not load more when hasMore is false", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.pageSize = 10;
    service.applyFilters();
    const result = service.loadMore();
    expect(result.length).toBe(service.products.length);
    expect(service.hasMore).toBe(false);
  });

  it("should update filters and emit event", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ keyword: "glass" });
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      EVENTS.PRODUCTS_FILTERED,
      expect.objectContaining({
        total: 1,
        filters: expect.objectContaining({ keyword: "glass" }),
      }),
    );
  });
});

describe("ProductsService - additional edge cases", () => {
  let mockRepo, mockEventBus;

  beforeEach(() => {
    mockRepo = {
      findAll: vi
        .fn()
        .mockReturnValue([
          new Product({ id: 1, name: "Container", price: 150000 }),
          new Product({ id: 2, name: "Mug", price: 120000 }),
          new Product({ id: 3, name: "Jar", price: 80000 }),
        ]),
    };
    mockEventBus = { emit: vi.fn() };
  });

  it("applySort should handle default value correctly (no sorting)", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    const originalOrder = service.products.map((p) => p.id);
    service.applySort("default");
    expect(service.filteredProducts.map((p) => p.id)).toEqual(originalOrder);
  });

  it("hasMore should return false when no more products", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.pageSize = 10;
    service.applyFilters();
    expect(service.hasMore).toBe(false);
  });

  it("hasMore should return true when there are more products", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.pageSize = 1;
    service.applyFilters();
    expect(service.hasMore).toBe(true);
  });

  it("loadMore should return current page reference when hasMore is false", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.pageSize = 10;
    service.applyFilters();
    const currentPage = service.getCurrentPage();
    const result = service.loadMore();
    expect(result).toEqual(currentPage);
    expect(service.hasMore).toBe(false);
  });

  it("updateFilters should merge multiple filters correctly", () => {
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();

    service.updateFilters({ keyword: "Mug" });
    expect(service.filters.keyword).toBe("Mug");
    expect(service.filteredProducts.length).toBe(1);

    service.updateFilters({ maxPrice: 120000 });
    expect(service.filters.maxPrice).toBe(120000);
    expect(service.filters.keyword).toBe("Mug");
    expect(service.filteredProducts.length).toBe(1);

    service.updateFilters({ sort: "price-asc" });
    expect(service.filters.sort).toBe("price-asc");
    expect(service.filters.maxPrice).toBe(120000);
    expect(service.filters.keyword).toBe("Mug");
    expect(service.filteredProducts.length).toBe(1);

    service.updateFilters({ keyword: "" });
    expect(service.filteredProducts.length).toBe(2);
  });
});
