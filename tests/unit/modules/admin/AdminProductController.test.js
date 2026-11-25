// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProducts: vi.fn(),
  isAuthenticated: true,
  getCurrentUser: vi.fn(() => ({ role: "ADMIN" })),
}));

vi.mock("../../../../src/modules/admin/AdminService.js", () => ({
  AdminService: class {
    getProducts = mocks.getProducts;
  },
}));

vi.mock("../../../../src/modules/auth/AuthService.js", () => ({
  authService: {
    get isAuthenticated() {
      return mocks.isAuthenticated;
    },
    getCurrentUser: mocks.getCurrentUser,
  },
}));

import { AdminProductController } from "../../../../src/modules/admin/AdminProductController.js";

describe("AdminProductController", () => {
  let controller;

  beforeEach(() => {
    document.body.innerHTML = '<table><tbody id="admin-products-table-body"></tbody></table>';
    mocks.getProducts.mockReset();
    mocks.getProducts.mockResolvedValue({ products: [] });
    mocks.isAuthenticated = true;
    mocks.getCurrentUser.mockReturnValue({ role: "ADMIN" });
    controller = new AdminProductController();
  });

  it("escapes untrusted product text and attributes", () => {
    controller.products = [{
      id: 'p-1" onmouseover="alert(1)',
      name: '<img src=x onerror=alert(1)>',
      slug: '"><script>alert(1)</script>',
      category: '<svg onload=alert(1)>',
      price: 120000,
      stock: 3,
      isActive: true,
      images: ["https://cdn.example.test/product.png"],
    }];

    controller.renderTable();

    const tbody = document.getElementById("admin-products-table-body");
    expect(tbody.querySelector("script")).toBeNull();
    expect(tbody.querySelector("svg")).toBeNull();
    expect(tbody.querySelector("img[onerror]")).toBeNull();
    expect(tbody.querySelector("[onmouseover]")).toBeNull();
    expect(tbody.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(tbody.textContent).toContain('<svg onload=alert(1)>');
    expect(tbody.querySelector('[data-action="edit"]').dataset.id).toBe(
      'p-1" onmouseover="alert(1)',
    );
  });

  it("rejects dangerous image URL schemes", () => {
    controller.products = [{
      id: "p-2",
      name: "Product",
      slug: "product",
      category: "Kitchen",
      price: 10,
      stock: 1,
      isActive: true,
      images: ["javascript:alert(1)"],
    }];

    controller.renderTable();

    expect(document.querySelector("#admin-products-table-body img").getAttribute("src"))
      .toBe("https://via.placeholder.com/40");
  });

  it("keeps valid HTTPS image URLs and product actions", () => {
    controller.products = [{
      id: "p-3",
      name: "Pan",
      slug: "pan",
      category: "Kitchen",
      price: 250000,
      stock: 5,
      isActive: false,
      images: ["https://cdn.example.test/pan.png"],
    }];

    controller.renderTable();

    const image = document.querySelector("#admin-products-table-body img");
    expect(image.getAttribute("src")).toBe("https://cdn.example.test/pan.png");
    expect(document.querySelector('[data-action="restore"]').dataset.id).toBe("p-3");
  });

  it("renders API errors as text instead of HTML", async () => {
    mocks.getProducts.mockRejectedValue(
      new Error('<img src=x onerror="alert(1)">'),
    );

    await controller.loadProducts();

    const tbody = document.getElementById("admin-products-table-body");
    expect(tbody.querySelector("img")).toBeNull();
    expect(tbody.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it("continues rendering an empty product state", () => {
    controller.products = [];
    controller.renderTable();

    expect(document.querySelector("#admin-products-table-body").textContent)
      .toContain("Chưa có sản phẩm nào");
  });
});
