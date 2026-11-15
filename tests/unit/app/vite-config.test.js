import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import config from "../../../vite.config.js";

describe("Vite multi-page build entries", () => {
  const input = config.build.rollupOptions.input;

  it.each([
    ["adminDashboard", "admin-dashboard.html"],
    ["adminProducts", "admin-products.html"],
    ["orderHistory", "order-history.html"],
    ["orderDetail", "order-detail.html"],
  ])("builds the %s page entry", (entryName, fileName) => {
    expect(input[entryName]).toBe(resolve(process.cwd(), "pages", fileName));
  });
});
