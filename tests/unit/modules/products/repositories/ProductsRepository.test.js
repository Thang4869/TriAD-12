import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsRepository } from "../../../../../src/modules/products/repositories/ProductsRepository.js";
import { Product } from "../../../../../src/shared/models/index.js";

describe("ProductsRepository", () => {
  let api;
  let repository;

  const productData = {
    id: "product-1",
    name: "Premium Lunch Box",
    description: "Test product",
    price: 100000,
    stock: 10,
    category: "Lunch Box",
    images: ["product.jpg"],
    slug: "premium-lunch-box",
    isActive: true,
    avgRating: 4.5,
    reviewCount: 10,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
  };

  beforeEach(() => {
    api = {
      get: vi.fn(),
    };

    repository = new ProductsRepository(api);
  });

  describe("findPage", () => {
    it("should request products from backend with query params", async () => {
      api.get.mockResolvedValue({
        products: [productData],
        total: 1,
        page: 2,
        limit: 12,
        totalPages: 3,
      });

      await repository.findPage({
        page: 2,
        limit: 12,
        keyword: "lunch",
        minPrice: 50000,
        maxPrice: 200000,
        sortBy: "price",
        sortOrder: "asc",
      });

      expect(api.get).toHaveBeenCalledWith("/products", {
        page: 2,
        limit: 12,
        keyword: "lunch",
        minPrice: 50000,
        maxPrice: 200000,
        sortBy: "price",
        sortOrder: "asc",
      });
    });

    it("should map backend products to Product instances", async () => {
      api.get.mockResolvedValue({
        products: [productData],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      });

      const result = await repository.findPage({
        page: 1,
        limit: 12,
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toBeInstanceOf(Product);
      expect(result.products[0].id).toBe("product-1");
      expect(result.products[0].name).toBe("Premium Lunch Box");
      expect(result.products[0].category).toBe("Lunch Box");
      expect(result.products[0].images).toEqual(["product.jpg"]);
    });

    it("should return pagination metadata from backend", async () => {
      api.get.mockResolvedValue({
        products: [productData],
        total: 25,
        page: 2,
        limit: 12,
        totalPages: 3,
      });

      const result = await repository.findPage({
        page: 2,
        limit: 12,
      });

      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(3);
    });

    it("should handle an empty products page", async () => {
      api.get.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });

      const result = await repository.findPage({
        page: 1,
        limit: 12,
      });

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(0);
    });

    it("should propagate API errors", async () => {
      const error = new Error("Products API unavailable");
      api.get.mockRejectedValue(error);

      await expect(
        repository.findPage({
          page: 1,
          limit: 12,
        }),
      ).rejects.toBe(error);
    });
  });
  // Thêm vào tests/unit/modules/products/repositories/ProductsRepository.test.js

  describe("findById", () => {
    it("returns a Product instance for the given ID", async () => {
      api.get.mockResolvedValue(productData);

      const result = await repository.findById("product-1");

      expect(api.get).toHaveBeenCalledWith("/products/product-1");
      expect(result).toBeInstanceOf(Product);
      expect(result.id).toBe("product-1");
    });

    it("propagates API errors", async () => {
      const error = new Error("Product not found");
      api.get.mockRejectedValue(error);

      await expect(repository.findById("missing")).rejects.toBe(error);
    });
  });

  describe("findBySlug", () => {
    it("returns a Product instance for the given slug", async () => {
      api.get.mockResolvedValue(productData);

      const result = await repository.findBySlug("premium-lunch-box");

      expect(api.get).toHaveBeenCalledWith("/products/slug/premium-lunch-box");
      expect(result).toBeInstanceOf(Product);
      expect(result.slug).toBe("premium-lunch-box");
    });

    it("propagates API errors", async () => {
      const error = new Error("Slug not found");
      api.get.mockRejectedValue(error);

      await expect(repository.findBySlug("missing")).rejects.toBe(error);
    });
  });

  describe("getCategories", () => {
    it("fetches the category list from backend", async () => {
      const categories = [
        { name: "Lunch Box", count: 5 },
        { name: "Storage", count: 3 },
      ];
      api.get.mockResolvedValue(categories);

      const result = await repository.getCategories();

      expect(api.get).toHaveBeenCalledWith("/products/categories");
      expect(result).toEqual(categories);
    });
  });

  describe("search", () => {
    it("maps backend search results to Product instances", async () => {
      api.get.mockResolvedValue({
        products: [productData],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      });

      const result = await repository.search("lunch", 1, 12);

      expect(api.get).toHaveBeenCalledWith("/products/search", {
        q: "lunch",
        page: 1,
        limit: 12,
      });
      expect(result.products[0]).toBeInstanceOf(Product);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(1);
    });

    it("uses default page/limit when omitted", async () => {
      api.get.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });

      await repository.search("x");

      expect(api.get).toHaveBeenCalledWith("/products/search", {
        q: "x",
        page: 1,
        limit: 12,
      });
    });

    it("propagates search errors", async () => {
      api.get.mockRejectedValue(new Error("Search failed"));

      await expect(repository.search("x")).rejects.toThrow("Search failed");
    });
  });
});
