import { describe, it, expect, beforeEach } from "vitest";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";

describe("ProductModel", () => {
  const productData = {
    id: 1,
    name: "TriAD Storage Container (1000ml)",
    color: "White",
    price: 150000,
    image: "../images/21.jpg",
    filter: "grayscale",
  };

  describe("constructor", () => {
    it("should set default filter when not provided", () => {
      const { filter, ...dataWithoutFilter } = productData;
      const product = new ProductModel(dataWithoutFilter);
      expect(product.filter).toBe("");
    });

    it("should create instance with all fields", () => {
      const product = new ProductModel(productData);
      expect(product.id).toBe(1);
      expect(product.name).toBe("TriAD Storage Container (1000ml)");
      expect(product.color).toBe("White");
      expect(product.price).toBe(150000);
      expect(product.image).toBe("../images/21.jpg");
      expect(product.filter).toBe("grayscale");
    });
  });

  describe("getters", () => {
    let product;

    beforeEach(() => {
      product = new ProductModel(productData);
    });

    it("should expose id, name, color, price, image, filter", () => {
      expect(product.id).toBe(1);
      expect(product.name).toBe("TriAD Storage Container (1000ml)");
      expect(product.color).toBe("White");
      expect(product.price).toBe(150000);
      expect(product.image).toBe("../images/21.jpg");
      expect(product.filter).toBe("grayscale");
    });

    it("should format price with currency", () => {
      expect(product.formattedPrice).toBe("150.000 ₫");
    });

    it("should return display name as 'name - color'", () => {
      expect(product.displayName).toBe("TriAD Storage Container (1000ml) - White");
    });

    it("should return searchable text in lowercase", () => {
      expect(product.searchableText).toBe("triad storage container (1000ml) white");
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

    it("should return true when keyword matches name or color (case-insensitive)", () => {
      expect(product.matchesKeyword("storage")).toBe(true);
      expect(product.matchesKeyword("container")).toBe(true);
      expect(product.matchesKeyword("1000ml")).toBe(true);
      expect(product.matchesKeyword("white")).toBe(true);
      expect(product.matchesKeyword("TRIAD")).toBe(true);
    });

    it("should return false when keyword does not match", () => {
      expect(product.matchesKeyword("xyz")).toBe(false);
      expect(product.matchesKeyword("black")).toBe(false);
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
    it("should convert to JSON", () => {
      const product = new ProductModel(productData);
      expect(product.toJSON()).toEqual(productData);
    });

    it("should create instance from JSON", () => {
      const product = ProductModel.fromJSON(productData);
      expect(product).toBeInstanceOf(ProductModel);
      expect(product.id).toBe(1);
      expect(product.name).toBe(productData.name);
      expect(product.color).toBe(productData.color);
      expect(product.price).toBe(productData.price);
      expect(product.image).toBe(productData.image);
      expect(product.filter).toBe(productData.filter);
    });
  });
});