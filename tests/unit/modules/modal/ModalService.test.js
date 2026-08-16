import { describe, it, expect, beforeEach } from "vitest";
import { ModalService } from "../../../../src/modules/modal/ModalService.js";

describe("ModalService", () => {
  let service;

  beforeEach(() => {
    service = new ModalService();
  });

  it("should set product", () => {
    service.setProduct(1);
    expect(service.getProductId()).toBe(1);
    expect(service.getQuantity()).toBe(1);
  });

  it("should update quantity", () => {
    service.setProduct(1);
    service.updateQuantity(2);
    expect(service.getQuantity()).toBe(3);
  });

  it("should not let quantity go below 1", () => {
    service.setProduct(1);
    service.updateQuantity(-5);
    expect(service.getQuantity()).toBe(1);
  });

  it("should reset state", () => {
    service.setProduct(1);
    service.updateQuantity(3);
    service.isOpen = true;

    service.reset();
    expect(service.getProductId()).toBe(null);
    expect(service.getQuantity()).toBe(1);
    expect(service.isOpen).toBe(false);
  });

  it("should open modal", () => {
    const eventSpy = vi.spyOn(service, "setProduct");
    service.open(1);
    expect(eventSpy).toHaveBeenCalledWith(1);
    expect(service.isOpen).toBe(true);
  });

  it("should close modal", () => {
    service.open(1);
    service.close();
    expect(service.isOpen).toBe(false);
    expect(service.getProductId()).toBe(null);
  });
});
