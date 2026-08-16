import { describe, it, expect } from "vitest";
import { ProductModel } from "../../../../src/shared/models/ProductModel.js";

describe("ProductModel", () => {
  const productData = {
    id: 1,
    name: "TriAD Storage Container (1000ml)",
    color: "White",
    price: 150000,
    image: "../images/21.jpg",
    filter: "",
  };

  it("should create a product instance", () => {
    const product = new ProductModel(productData);
    expect(product.id).toBe(1);
    expect(product.name).toBe("TriAD Storage Container (1000ml)");
    expect(product.price).toBe(150000);
  });

  it("should format price correctly", () => {
    const product = new ProductModel(productData);
    expect(product.formattedPrice).toBe("150.000 ₫");
  });

  it("should match keyword correctly", () => {
    const product = new ProductModel(productData);
    expect(product.matchesKeyword("storage")).toBe(true);
    expect(product.matchesKeyword("container")).toBe(true);
    expect(product.matchesKeyword("1000ml")).toBe(true);
    expect(product.matchesKeyword("xyz")).toBe(false);
  });

  it("should match price range correctly", () => {
    const product = new ProductModel(productData);
    expect(product.matchesPriceRange(100000, 200000)).toBe(true);
    expect(product.matchesPriceRange(160000, 200000)).toBe(false);
  });

  it("should serialize to JSON", () => {
    const product = new ProductModel(productData);
    const json = product.toJSON();
    expect(json).toEqual(productData);
  });

  it("should deserialize from JSON", () => {
    const product = ProductModel.fromJSON(productData);
    expect(product).toBeInstanceOf(ProductModel);
    expect(product.name).toBe(productData.name);
  });
});
