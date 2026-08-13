import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModalController } from '../../../../src/modules/modal/ModalController.js';
import { ProductModel } from '../../../../src/shared/models/ProductModel.js';

describe('ModalController', () => {
  let modalController;
  const mockProduct = new ProductModel({
    id: 1,
    name: 'Test Product',
    color: 'White',
    price: 150000,
    image: 'test.jpg'
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="product-modal-overlay" class="hidden">
        <div id="product-modal-content">
          <button id="close-modal-btn"></button>
          <h2 id="modal-title"></h2>
          <p id="modal-price"></p>
          <img id="modal-img" src="">
          <span id="modal-quantity">1</span>
          <button id="qty-plus"></button>
          <button id="qty-minus"></button>
          <button id="add-cart-btn"></button>
          <button id="modal-buy-now-btn"></button>
        </div>
      </div>
    `;

    window.productsController = {
      getProduct: vi.fn().mockReturnValue(mockProduct)
    };

    window.cartController = {
      addToCart: vi.fn(),
      openDrawer: vi.fn()
    };

    window.notifications = {
      add: vi.fn()
    };

    modalController = new ModalController();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should open modal with product data', () => {
    modalController.open(1);
    
    const overlay = document.getElementById('product-modal-overlay');
    expect(overlay.classList.contains('hidden')).toBe(false);
    
    const title = document.getElementById('modal-title');
    expect(title.textContent).toBe('Test Product');
    
    const price = document.getElementById('modal-price');
    expect(price.textContent).toBe('150.000 ₫');
  });

  it('should close modal', () => {
    modalController.open(1);
    modalController.close();
    
    vi.runAllTimers();
    
    const overlay = document.getElementById('product-modal-overlay');
    expect(overlay.classList.contains('hidden')).toBe(true);
    expect(document.body.style.overflow).toBe('');
  });

  it('should update quantity', () => {
    modalController.open(1);
    const quantityEl = document.getElementById('modal-quantity');
    
    document.getElementById('qty-plus').click();
    expect(quantityEl.textContent).toBe('2');
    
    document.getElementById('qty-minus').click();
    expect(quantityEl.textContent).toBe('1');
  });

  it('should not decrease quantity below 1', () => {
    modalController.open(1);
    const quantityEl = document.getElementById('modal-quantity');
    
    document.getElementById('qty-minus').click();
    expect(quantityEl.textContent).toBe('1');
  });

  it('should add to cart when clicking add to cart button', () => {
    modalController.open(1);
    document.getElementById('add-cart-btn').click();
    
    expect(window.cartController.addToCart).toHaveBeenCalled();
    vi.runAllTimers();
    expect(window.cartController.openDrawer).toHaveBeenCalled();
  });
});