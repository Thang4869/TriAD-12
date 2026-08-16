import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductsRepository } from "../../../../../src/modules/products/repositories/ProductsRepository.js";
import { Product } from "../../../../../src/shared/models/index.js";
import { products as PRODUCTS_DATA } from "../../../../../src/config/products.config.js";

vi.mock("../../../../../src/config/products.config.js", () => ({
  products: [
    { id: 1, name: "Product 1", color: "White", price: 100, image: "img1.jpg" },
    { id: 2, name: "Product 2", color: "Black", price: 200, image: "img2.jpg" },
  ],
}));

describe("ProductsRepository", () => {
  let mockStorage;
  let repository;

  beforeEach(() => {
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };
    repository = new ProductsRepository(mockStorage);
  });

  it("should findAll and seed if storage empty", () => {
    mockStorage.get.mockReturnValue(null);
    const result = repository.findAll();
    expect(result.length).toBe(2);
    expect(result[0]).toBeInstanceOf(Product);
    expect(mockStorage.set).toHaveBeenCalledWith("products", expect.any(Array));
  });

  it("should findAll from storage if data exists", () => {
    const storedData = [
      {
        id: 3,
        name: "Stored Product",
        color: "Red",
        price: 300,
        image: "img3.jpg",
      },
    ];
    mockStorage.get.mockReturnValue(storedData);
    const result = repository.findAll();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(3);
    expect(mockStorage.set).not.toHaveBeenCalled();
  });

  it("should findByIds", () => {
    const storedData = [
      { id: 1, name: "A", color: "White", price: 100, image: "a.jpg" },
      { id: 2, name: "B", color: "Black", price: 200, image: "b.jpg" },
      { id: 3, name: "C", color: "Blue", price: 300, image: "c.jpg" },
    ];
    mockStorage.get.mockReturnValue(storedData);
    const result = repository.findByIds([1, 3]);
    expect(result.length).toBe(2);
    expect(result.map((p) => p.id)).toEqual([1, 3]);
  });

  it("should save items (inherited from BaseRepository)", () => {
    const items = [
      new Product({
        id: 10,
        name: "New",
        color: "Green",
        price: 500,
        image: "new.jpg",
      }),
    ];
    repository.save(items);
    expect(mockStorage.set).toHaveBeenCalledWith("products", expect.any(Array));
  });

  it("should clear (inherited)", () => {
    repository.clear();
    expect(mockStorage.remove).toHaveBeenCalledWith("products");
  });
});
