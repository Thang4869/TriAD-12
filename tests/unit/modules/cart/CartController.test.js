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

describe('CartController additional edge cases', () => {
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
    window.flyToCart = { fly: vi.fn() };
    cartController = new CartController();
    cartController.clear();
  });

  afterEach(() => {
    delete window.flyToCart;
  });

  it('should not open drawer if already open', () => {
    cartController.isDrawerOpen = true;
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    const spyOverlay = vi.spyOn(overlay.classList, 'remove');
    const spyDrawer = vi.spyOn(drawer.classList, 'remove');
    cartController.openDrawer();
    expect(spyOverlay).not.toHaveBeenCalled();
    expect(spyDrawer).not.toHaveBeenCalled();
  });

  it('should not close drawer if already closed', () => {
    cartController.isDrawerOpen = false;
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    const spyOverlay = vi.spyOn(overlay.classList, 'add');
    const spyDrawer = vi.spyOn(drawer.classList, 'add');
    cartController.closeDrawer();
    expect(spyOverlay).not.toHaveBeenCalled();
    expect(spyDrawer).not.toHaveBeenCalled();
  });

  it('should handle missing overlay/drawer gracefully on open', () => {
    document.body.innerHTML = '';
    const ctrl = new CartController();
    expect(() => ctrl.openDrawer()).not.toThrow();
  });

  it('should handle missing overlay/drawer gracefully on close', () => {
    document.body.innerHTML = '';
    const ctrl = new CartController();
    expect(() => ctrl.closeDrawer()).not.toThrow();
  });

  it('should call flyToCart when addToCart with flyElement', () => {
    const img = document.createElement('img');
    cartController.addToCart(mockProduct, 1, img);
    expect(window.flyToCart.fly).toHaveBeenCalledWith(img);
  });

  it('should not call flyToCart if not available', () => {
    delete window.flyToCart;
    const img = document.createElement('img');
    expect(() => cartController.addToCart(mockProduct, 1, img)).not.toThrow();
  });

  it('should setup event listeners for cart actions', () => {
    const item = cartController.addToCart(mockProduct)[0];
    const removeBtn = document.createElement('button');
    removeBtn.dataset.action = 'remove';
    removeBtn.dataset.id = item.id;
    document.body.appendChild(removeBtn);
    const removeSpy = vi.spyOn(cartController, 'removeItem');
    removeBtn.click();
    expect(removeSpy).toHaveBeenCalledWith(item.id);
  });

  it('should handle increase/decrease actions', () => {
    const item = cartController.addToCart(mockProduct)[0];
    const incBtn = document.createElement('button');
    incBtn.dataset.action = 'increase';
    incBtn.dataset.id = item.id;
    document.body.appendChild(incBtn);
    const incSpy = vi.spyOn(cartController, 'increaseItem');
    incBtn.click();
    expect(incSpy).toHaveBeenCalledWith(item.id);

    const decBtn = document.createElement('button');
    decBtn.dataset.action = 'decrease';
    decBtn.dataset.id = item.id;
    document.body.appendChild(decBtn);
    const decSpy = vi.spyOn(cartController, 'decreaseItem');
    decBtn.click();
    expect(decSpy).toHaveBeenCalledWith(item.id);
  });
});

describe('CartController - drawer state and event handling', () => {
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
      <button data-id="1" data-action="remove">Remove</button>
      <button data-id="1" data-action="increase">+</button>
      <button data-id="1" data-action="decrease">-</button>
    `;
    cartController = new CartController();
    cartController.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('openDrawer should not change state if drawer already open', () => {
    cartController.isDrawerOpen = true;
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    const spyOverlay = vi.spyOn(overlay.classList, 'remove');
    const spyDrawer = vi.spyOn(drawer.classList, 'remove');

    cartController.openDrawer();
    expect(spyOverlay).not.toHaveBeenCalled();
    expect(spyDrawer).not.toHaveBeenCalled();
    expect(cartController.isDrawerOpen).toBe(true);
  });

  it('closeDrawer should not change state if drawer already closed', () => {
    cartController.isDrawerOpen = false;
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    const spyOverlay = vi.spyOn(overlay.classList, 'add');
    const spyDrawer = vi.spyOn(drawer.classList, 'add');

    cartController.closeDrawer();
    expect(spyOverlay).not.toHaveBeenCalled();
    expect(spyDrawer).not.toHaveBeenCalled();
    expect(cartController.isDrawerOpen).toBe(false);
  });

  it('should safely handle missing overlay or drawer on open', () => {
    document.body.innerHTML = '<div id="cart-drawer"></div>';
    const ctrl = new CartController();
    expect(() => ctrl.openDrawer()).not.toThrow();
  });

  it('should safely handle missing overlay or drawer on close', () => {
    document.body.innerHTML = '<div id="cart-overlay"></div>';
    const ctrl = new CartController();
    expect(() => ctrl.closeDrawer()).not.toThrow();
  });

  it('should handle click events on elements with [data-id] for remove/increase/decrease', () => {
    const removeBtn = document.querySelector('[data-action="remove"]');
    const incBtn = document.querySelector('[data-action="increase"]');
    const decBtn = document.querySelector('[data-action="decrease"]');

    cartController.addToCart(mockProduct);

    const removeSpy = vi.spyOn(cartController, 'removeItem');
    const incSpy = vi.spyOn(cartController, 'increaseItem');
    const decSpy = vi.spyOn(cartController, 'decreaseItem');

    removeBtn.click();
    expect(removeSpy).toHaveBeenCalledWith(1);

    incBtn.click();
    expect(incSpy).toHaveBeenCalledWith(1);

    decBtn.click();
    expect(decSpy).toHaveBeenCalledWith(1);
  });

  it('should ignore click on [data-id] without action', () => {
    const btn = document.createElement('button');
    btn.dataset.id = '1';
    document.body.appendChild(btn);
    const spy = vi.spyOn(cartController, 'removeItem');
    btn.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle openDrawer when overlay missing', () => {
    document.body.innerHTML = '<div id="cart-drawer"></div>';
    const ctrl = new CartController();
    expect(() => ctrl.openDrawer()).not.toThrow();
  });

  it('should handle addToCart when flyElement is null', () => {
    const result = cartController.addToCart(mockProduct, 1, null);
    expect(result).toBeDefined();
  });
});