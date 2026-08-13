import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartController } from '../../../../src/modules/cart/CartController.js';
import { ProductModel } from '../../../../src/shared/models/ProductModel.js';

describe('CartController', () => {
  let cartController;
  const mockProduct = new ProductModel({
    id: 1,
    name: 'Test Product',
    color: 'White',
    price: 100000,
    image: 'test.jpg'
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="cart-overlay"></div>
      <div id="cart-drawer"></div>
      <span id="cart-badge">0</span>
      <button id="checkout-btn">Checkout</button>
    `;
    cartController = new CartController();
    cartController.clear();
  });

  it('should add product to cart', () => {
    cartController.addToCart(mockProduct);
    const items = cartController.getItems();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe(1);
  });

  it('should increase item quantity', () => {
    cartController.addToCart(mockProduct);
    cartController.increaseItem(1);
    const items = cartController.getItems();
    expect(items[0].quantity).toBe(2);
  });

  it('should decrease item quantity', () => {
    cartController.addToCart(mockProduct, 2);
    cartController.decreaseItem(1);
    const items = cartController.getItems();
    expect(items[0].quantity).toBe(1);
  });

  it('should remove item from cart', () => {
    cartController.addToCart(mockProduct);
    cartController.removeItem(1);
    const items = cartController.getItems();
    expect(items.length).toBe(0);
  });

  it('should clear cart', () => {
    cartController.addToCart(mockProduct);
    cartController.clear();
    const items = cartController.getItems();
    expect(items.length).toBe(0);
  });

  it('should get correct total', () => {
    cartController.addToCart(mockProduct, 2);
    expect(cartController.getTotal()).toBe(200000);
  });

  it('should get correct count', () => {
    cartController.addToCart(mockProduct, 3);
    expect(cartController.getCount()).toBe(3);
  });
});