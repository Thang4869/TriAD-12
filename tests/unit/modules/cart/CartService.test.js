import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService } from '../../../../src/modules/cart/CartService.js';
import { ProductModel } from '../../../../src/shared/models/ProductModel.js';

describe('CartService', () => {
  let cartService;
  const mockProduct = new ProductModel({ id: 1, name: 'Product A', color: 'White', price: 100000, image: 'a.jpg' });

  beforeEach(() => {
    cartService = new CartService();
    cartService.clear();
  });

  it('should add product to cart', () => {
    const result = cartService.add(mockProduct, 2);
    expect(result.length).toBe(1);
    expect(result[0].quantity).toBe(2);
    expect(cartService.count).toBe(2);
    expect(cartService.total).toBe(200000);
  });

  it('should increase quantity of existing item', () => {
    cartService.add(mockProduct, 1);
    cartService.increase(1);
    expect(cartService.items[0].quantity).toBe(2);
    expect(cartService.count).toBe(2);
  });

  it('should decrease quantity and remove item when quantity becomes 0', () => {
    cartService.add(mockProduct, 1);
    cartService.decrease(1);
    expect(cartService.items.length).toBe(0);
    expect(cartService.count).toBe(0);
  });

  it('should remove item completely', () => {
    cartService.add(mockProduct, 3);
    cartService.remove(1);
    expect(cartService.items.length).toBe(0);
  });

  it('should clear cart', () => {
    cartService.add(mockProduct, 2);
    cartService.clear();
    expect(cartService.items.length).toBe(0);
    expect(cartService.count).toBe(0);
  });
});