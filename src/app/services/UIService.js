import { Logger } from '../../core/services/Logger.js';

export class UIService {
  constructor(cartController) {
    this.cartController = cartController;
    this._initMobileMenu();
    this._initCartDrawer();
    this._initSearchSuggestion();
    this._initAccordion();
    Logger.debug('UIService initialized');
  }

  _initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    let isOpen = false;

    if (btn && menu) {
      btn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
          menu.classList.remove('hidden');
          btn.innerHTML = '<i class="ph ph-x text-2xl"></i>';
        } else {
          menu.classList.add('hidden');
          btn.innerHTML = '<i class="ph ph-list text-2xl"></i>';
        }
      });

      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          isOpen = false;
          menu.classList.add('hidden');
          btn.innerHTML = '<i class="ph ph-list text-2xl"></i>';
        });
      });
    }
  }

  _initCartDrawer() {
    const overlay = document.getElementById('cart-overlay');
    const closeBtn = document.getElementById('close-cart-btn');
    const cartIcon = document.getElementById('cart-icon-btn');
    const mobileCart = document.getElementById('mobile-cart-btn');

    const openDrawer = () => {
      if (this.cartController) {
        this.cartController.openDrawer();
      }
    };

    if (cartIcon) {
      cartIcon.addEventListener('click', openDrawer);
    }
    if (mobileCart) {
      mobileCart.addEventListener('click', openDrawer);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.cartController) {
          this.cartController.closeDrawer();
        }
      });
    }
    if (overlay) {
      overlay.addEventListener('click', () => {
        if (this.cartController) {
          this.cartController.closeDrawer();
        }
      });
    }
  }

  _initSearchSuggestion() {
    const suggestion = document.getElementById('search-suggestion');
    if (suggestion) {
      document.addEventListener('click', (e) => {
        if (!suggestion.contains(e.target) && e.target.id !== 'search-input') {
          suggestion.classList.add('hidden');
        }
      });
    }
  }

  _initAccordion() {
    const firstAccordion = document.querySelector('.accordion-item');
    if (firstAccordion) {
      firstAccordion.classList.add('accordion-active');
    }
  }
}