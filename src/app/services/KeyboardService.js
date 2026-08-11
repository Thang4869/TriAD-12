import { Logger } from '../../core/services/Logger.js';

export class KeyboardService {
  constructor(cartController, modalController, checkoutController) {
    this.cartController = cartController;
    this.modalController = modalController;
    this.checkoutController = checkoutController;
    this._registerShortcuts();
    Logger.debug('KeyboardService initialized');
  }

  _registerShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.modalController?.service?.isOpen) {
          this.modalController.close();
          return;
        }

        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
          this.checkoutController?.closeCheckout();
          return;
        }

        const successModal = document.getElementById('success-modal');
        if (successModal && !successModal.classList.contains('hidden')) {
          this.checkoutController?.closeSuccess();
          return;
        }

        if (this.cartController?.isDrawerOpen) {
          this.cartController.closeDrawer();
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const search = document.getElementById('search-input');
        if (search) search.focus();
      }
    });
  }
}