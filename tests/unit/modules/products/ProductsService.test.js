import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsService } from "../../../../src/modules/products/services/ProductsService.js";
import { EVENTS } from "../../../../src/shared/constants/Events.js";

describe("ProductsService", () => {
  let repository;
  let eventBus;
  let service;

  const products = [
    { id: 1, name: "Glass Container", price: 150000 },
    { id: 2, name: "Thermo Mug", price: 120000 },
    { id: 3, name: "Airtight Jar", price: 80000 },
  ];

  const pageResult = (overrides = {}) => ({
    products,
    page: 1,
    totalPages: 1,
    total: products.length,
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      findPage: vi.fn().mockResolvedValue(pageResult()),
    };

    eventBus = {
      emit: vi.fn(),
    };

    service = new ProductsService(repository, eventBus);
  });

  describe("defaults", () => {
    it("initializes default state", () => {
      expect(service.products).toEqual([]);
      expect(service.page).toBe(1);
      expect(service.totalPages).toBe(1);
      expect(service.total).toBe(0);
      expect(service.pageSize).toBe(12);
      expect(service.filters).toEqual({
        keyword: "",
        minPrice: 0,
        maxPrice: 350000,
        sort: "default",
      });
    });
  });

  describe("load", () => {
    it("loads first page from repository", async () => {
      const result = await service.load();

      expect(repository.findPage).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        keyword: undefined,
        minPrice: undefined,
        maxPrice: 350000,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result).toEqual(products);
      expect(service.products).toEqual(products);
      expect(service.page).toBe(1);
      expect(service.totalPages).toBe(1);
      expect(service.total).toBe(3);
    });

    it("emits loading, loaded and filtered events", async () => {
      await service.load();

      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_LOADING, {
        loading: true,
      });

      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_LOADED, {
        count: 3,
      });

      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_FILTERED, {
        total: 3,
        filters: service.filters,
      });

      expect(eventBus.emit).toHaveBeenCalledWith(EVENTS.PRODUCTS_LOADING, {
        loading: false,
      });
    });

    it("always stops loading when repository fails", async () => {
      repository.findPage.mockRejectedValue(new Error("API failure"));

      await expect(service.load()).rejects.toThrow("API failure");

      expect(eventBus.emit).toHaveBeenLastCalledWith(EVENTS.PRODUCTS_LOADING, {
        loading: false,
      });
    });
  });

  describe("sorting query", () => {
    it.each([
      ["price-asc", "price", "asc"],
      ["price-desc", "price", "desc"],
      ["name-asc", "name", "asc"],
      ["name-desc", "name", "desc"],
      ["default", "createdAt", "desc"],
    ])(
      "maps %s to backend sort parameters",
      async (sort, sortBy, sortOrder) => {
        await service.updateFilters({ sort });

        expect(repository.findPage).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
            sortBy,
            sortOrder,
          }),
        );
      },
    );
  });

  describe("filters", () => {
    it("sends filters to backend", async () => {
      await service.updateFilters({
        keyword: "glass",
        minPrice: 50000,
        maxPrice: 200000,
      });

      expect(repository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          keyword: "glass",
          minPrice: 50000,
          maxPrice: 200000,
        }),
      );

      expect(service.filters).toEqual(
        expect.objectContaining({
          keyword: "glass",
          minPrice: 50000,
          maxPrice: 200000,
        }),
      );
    });

    it("merges new filters with existing filters", async () => {
      await service.updateFilters({ keyword: "mug" });
      await service.updateFilters({ minPrice: 100000 });

      expect(service.filters).toEqual({
        keyword: "mug",
        minPrice: 100000,
        maxPrice: 350000,
        sort: "default",
      });
    });

    it("resets filters and reloads page one", async () => {
      await service.updateFilters({
        keyword: "glass",
        minPrice: 50000,
        sort: "price-asc",
      });

      repository.findPage.mockClear();

      await service.resetFilters();

      expect(service.filters).toEqual(service.getDefaultFilters());

      expect(repository.findPage).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        keyword: undefined,
        minPrice: undefined,
        maxPrice: 350000,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });
  });

  describe("pagination", () => {
    it("returns currently loaded products", async () => {
      await service.load();

      expect(service.getCurrentPage()).toBe(service.products);
      expect(service.getCurrentPage()).toEqual(products);
    });

    it("reports hasMore when another page exists", async () => {
      repository.findPage.mockResolvedValue(
        pageResult({
          page: 1,
          totalPages: 2,
          total: 4,
        }),
      );

      await service.load();

      expect(service.hasMore).toBe(true);
    });

    it("reports hasMore false on last page", async () => {
      repository.findPage.mockResolvedValue(
        pageResult({
          page: 2,
          totalPages: 2,
        }),
      );

      await service.load();

      expect(service.hasMore).toBe(false);
    });

    it("loads next page and appends new products", async () => {
      const firstPage = products.slice(0, 2);
      const secondPage = [{ id: 3, name: "Airtight Jar", price: 80000 }];

      repository.findPage
        .mockResolvedValueOnce(
          pageResult({
            products: firstPage,
            page: 1,
            totalPages: 2,
            total: 3,
          }),
        )
        .mockResolvedValueOnce(
          pageResult({
            products: secondPage,
            page: 2,
            totalPages: 2,
            total: 3,
          }),
        );

      await service.load();
      const result = await service.loadMore();

      expect(repository.findPage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );

      expect(result).toEqual(secondPage);
      expect(service.products).toEqual([...firstPage, ...secondPage]);
      expect(service.page).toBe(2);
      expect(service.hasMore).toBe(false);
    });

    it("does not call repository when there are no more pages", async () => {
      await service.load();
      repository.findPage.mockClear();

      const result = await service.loadMore();

      expect(result).toEqual([]);
      expect(repository.findPage).not.toHaveBeenCalled();
    });
  });

  describe("totalCount", () => {
    it("returns backend total", async () => {
      repository.findPage.mockResolvedValue(
        pageResult({
          total: 25,
          totalPages: 3,
        }),
      );

      await service.load();

      expect(service.totalCount).toBe(25);
    });
  });

  describe("getProductById", () => {
    it("finds product from already loaded products", async () => {
      await service.load();

      expect(service.getProductById(2)).toEqual(products[1]);
    });

    it("returns null when product is not loaded", async () => {
      await service.load();

      expect(service.getProductById(999)).toBeNull();
    });

    it("does not make another repository request", async () => {
      await service.load();
      repository.findPage.mockClear();

      service.getProductById(1);

      expect(repository.findPage).not.toHaveBeenCalled();
    });
  });
});
