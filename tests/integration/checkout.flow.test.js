import { screen, fireEvent } from '@testing-library/dom';
import { bootstrap } from '../../src/app/bootstrap';

describe('Checkout flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="header-container"></div>
      <div id="page-content">
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
      <button id="checkout-btn">Checkout</button>
    `;
  });

  it('should complete checkout successfully', async () => {
    await bootstrap();
  });
});