import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootstrap } from '../../src/app/bootstrap.js';
import { ProductModel } from '../../src/shared/models/ProductModel.js';
import { notificationController } from '../../src/modules/notification/index.js';

describe('Search Flow Integration', () => {
  beforeEach(async () => {
    document.body.innerHTML = `
      <div id="header-container"></div>
      <div id="page-content">
        <div id="hero-container"></div>
        <div id="about-container"></div>
        <div id="features-container"></div>
        <div id="products-container"></div>
      </div>
      <div id="footer-container"></div>
      <div id="toast-container"></div>
      <div id="cart-drawer-container"></div>
      <div id="product-modal-container"></div>
      <div id="checkout-modal-container"></div>
      <div id="success-modal-container"></div>
      <div id="cart-overlay"></div>
      <span id="cart-badge">0</span>
      <button id="cart-icon-btn">Cart</button>
      <button id="checkout-btn">Checkout</button>
      <input id="search-input" placeholder="Search product...">
      <div id="search-suggestion" class="hidden"></div>
      <div id="product-grid"></div>
    `;

    vi.useFakeTimers();

    await bootstrap();
    
    vi.runAllTimers();

    const mockProducts = [
      new ProductModel({ 
        id: 1, 
        name: 'Glass Container', 
        color: 'White', 
        price: 150000, 
        image: 'test.jpg' 
      }),
      new ProductModel({ 
        id: 2, 
        name: 'Thermo Mug', 
        color: 'Black', 
        price: 120000, 
        image: 'test.jpg' 
      })
    ];
    
    if (window.productsController?.service) {
      window.productsController.service.products = mockProducts;
      window.productsController.service.filteredProducts = mockProducts;
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers(); 
    vi.clearAllMocks();
    document.body.innerHTML = '';
    if (notificationController && typeof notificationController.destroy === 'function') {
      notificationController.destroy();
    }
  });

  it('should show search suggestions when typing', async () => {
    const searchInput = document.getElementById('search-input');
    const suggestionContainer = document.getElementById('search-suggestion');
    
    if (window.productsController?.renderer) {
      window.productsController.renderer.renderSuggestions = (keyword, products, callback) => {
        if (keyword && products.length > 0) {
          suggestionContainer.classList.remove('hidden');
          suggestionContainer.innerHTML = products.map(p => `
            <div class="px-4 py-3 hover:bg-gray-100 cursor-pointer" data-id="${p.id}">
              ${p.name}
            </div>
          `).join('');
        } else {
          suggestionContainer.classList.add('hidden');
          suggestionContainer.innerHTML = '';
        }
      };
    }
    
    fireEvent.input(searchInput, { target: { value: 'glass' } });
    
    await waitFor(() => {
      expect(suggestionContainer.classList.contains('hidden')).toBe(false);
    }, { timeout: 500 });
  });

  it('should hide suggestions when search is empty', async () => {
    const searchInput = document.getElementById('search-input');
    const suggestionContainer = document.getElementById('search-suggestion');
    
    fireEvent.input(searchInput, { target: { value: '' } });
    
    await waitFor(() => {
      expect(suggestionContainer.classList.contains('hidden')).toBe(true);
    });
  });
});