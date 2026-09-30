import { describe, it, expect, beforeEach } from "vitest";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";

describe("ProductModel", () => {
  const productData = {
    id: "product-1",
    name: "TriAD Storage Container (1000ml)",
    description: "Premium storage container",
    price: 150000,
    stock: 10,
    category: "Storage",
    images: ["../images/21.jpg"],
    slug: "triad-storage-container-1000ml",
    isActive: true,
    avgRating: 4.5,
    reviewCount: 12,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
  };

  describe("constructor", () => {
    it("should create instance with backend product fields", () => {
      const product = new ProductModel(productData);

      expect(product.id).toBe("product-1");
      expect(product.name).toBe("TriAD Storage Container (1000ml)");
      expect(product.description).toBe("Premium storage container");
      expect(product.price).toBe(150000);
      expect(product.stock).toBe(10);
      expect(product.category).toBe("Storage");
      expect(product.images).toEqual(["../images/21.jpg"]);
      expect(product.slug).toBe("triad-storage-container-1000ml");
      expect(product.isActive).toBe(true);
      expect(product.avgRating).toBe(4.5);
      expect(product.reviewCount).toBe(12);
    });

    it("should use default values for optional backend fields", () => {
      const product = new ProductModel({
        id: "product-1",
        name: "Product",
        price: 100000,
      });

      expect(product.description).toBe("");
      expect(product.stock).toBe(0);
      expect(product.category).toBe("");
      expect(product.images).toEqual([]);
      expect(product.slug).toBe("");
      expect(product.isActive).toBe(true);
      expect(product.avgRating).toBe(0);
      expect(product.reviewCount).toBe(0);
      expect(product.createdAt).toBeNull();
      expect(product.updatedAt).toBeNull();
      expect(product.reviews).toBeNull();
      expect(product.filter).toBe("");
    });

    it("should support legacy image as fallback for images", () => {
      const product = new ProductModel({
        id: "product-1",
        name: "Product",
        price: 100000,
        image: "legacy.jpg",
      });

      expect(product.images).toEqual(["legacy.jpg"]);
      expect(product.image).toBe("legacy.jpg");
    });

    it("should prefer images over legacy image", () => {
      const product = new ProductModel({
        id: "product-1",
        name: "Product",
        price: 100000,
        images: ["api.jpg"],
        image: "legacy.jpg",
      });

      expect(product.images).toEqual(["api.jpg"]);
      expect(product.image).toBe("api.jpg");
    });
  });

  describe("getters", () => {
    let product;

    beforeEach(() => {
      product = new ProductModel(productData);
    });

    it("should expose backend fields", () => {
      expect(product.id).toBe("product-1");
      expect(product.name).toBe(productData.name);
      expect(product.description).toBe(productData.description);
      expect(product.price).toBe(productData.price);
      expect(product.stock).toBe(productData.stock);
      expect(product.category).toBe(productData.category);
      expect(product.images).toEqual(productData.images);
      expect(product.slug).toBe(productData.slug);
      expect(product.isActive).toBe(true);
      expect(product.avgRating).toBe(4.5);
      expect(product.reviewCount).toBe(12);
      expect(product.createdAt).toBe(productData.createdAt);
      expect(product.updatedAt).toBe(productData.updatedAt);
    });

    it("should expose first image through compatibility alias", () => {
      expect(product.image).toBe("../images/21.jpg");
    });

    it("should expose category through color compatibility alias", () => {
      expect(product.color).toBe("Storage");
    });

    it("should format price with currency", () => {
      expect(product.formattedPrice).toBe("150.000 ₫");
    });

    it("should report stock availability", () => {
      expect(product.inStock).toBe(true);

      const outOfStock = new ProductModel({
        ...productData,
        stock: 0,
      });

      expect(outOfStock.inStock).toBe(false);
    });

    it("should return display name using category compatibility alias", () => {
      expect(product.displayName).toBe(
        "TriAD Storage Container (1000ml) - Storage",
      );
    });

    it("should return searchable text from name and category in lowercase", () => {
      expect(product.searchableText).toBe(
        "triad storage container (1000ml) storage",
      );
    });

    it("should return a copy of images", () => {
      const images = product.images;

      images.push("mutated.jpg");

      expect(product.images).toEqual(["../images/21.jpg"]);
    });
  });

  describe("matchesKeyword", () => {
    let product;

    beforeEach(() => {
      product = new ProductModel(productData);
    });

    it("should return true when keyword is empty, null, or undefined", () => {
      expect(product.matchesKeyword("")).toBe(true);
      expect(product.matchesKeyword(null)).toBe(true);
      expect(product.matchesKeyword(undefined)).toBe(true);
    });

    it("should match name or category case-insensitively", () => {
      expect(product.matchesKeyword("container")).toBe(true);
      expect(product.matchesKeyword("1000ml")).toBe(true);
      expect(product.matchesKeyword("storage")).toBe(true);
      expect(product.matchesKeyword("TRIAD")).toBe(true);
    });

    it("should return false when keyword does not match", () => {
      expect(product.matchesKeyword("white")).toBe(false);
      expect(product.matchesKeyword("xyz")).toBe(false);
    });
  });

  describe("matchesPriceRange", () => {
    let product;

    beforeEach(() => {
      product = new ProductModel(productData);
    });

    it("should return true when price is within inclusive range", () => {
      expect(product.matchesPriceRange(100000, 200000)).toBe(true);
      expect(product.matchesPriceRange(150000, 200000)).toBe(true);
      expect(product.matchesPriceRange(100000, 150000)).toBe(true);
    });

    it("should return false when price is outside range", () => {
      expect(product.matchesPriceRange(160000, 200000)).toBe(false);
      expect(product.matchesPriceRange(100000, 140000)).toBe(false);
    });
  });

  describe("serialization", () => {
    it("should serialize using backend product contract", () => {
      const product = new ProductModel(productData);

      expect(product.toJSON()).toEqual(productData);
    });

    it("should not serialize legacy compatibility fields", () => {
      const product = new ProductModel({
        ...productData,
        color: "White",
        image: "legacy.jpg",
        filter: "grayscale",
      });

      const json = product.toJSON();

      expect(json).not.toHaveProperty("color");
      expect(json).not.toHaveProperty("image");
      expect(json).not.toHaveProperty("filter");
    });

    it("should create instance from backend JSON", () => {
      const product = ProductModel.fromJSON(productData);

      expect(product).toBeInstanceOf(ProductModel);
      expect(product.id).toBe(productData.id);
      expect(product.name).toBe(productData.name);
      expect(product.category).toBe(productData.category);
      expect(product.images).toEqual(productData.images);
      expect(product.price).toBe(productData.price);
      expect(product.stock).toBe(productData.stock);
    });
  });
});
