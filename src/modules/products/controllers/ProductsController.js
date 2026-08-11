import { DomUtils } from '../../../core/utils/DomUtils.js';
import { EVENTS } from '../../../shared/constants/Events.js';

export class ProductsController {
  /**
   * @param {ProductsService} service
   * @param {ProductsRenderer} renderer
   * @param {EventBus} eventBus
   */
  constructor(service, renderer, eventBus) {
    this.service = service;
    this.renderer = renderer;
    this.eventBus = eventBus;
    this.isLoading = false;

    this.setupEventListeners();
    this.service.load();
  }

  setupEventListeners() {
    this.eventBus.on(EVENTS.PRODUCTS_FILTERED, (data) => {
      const items = this.service.getCurrentPage();
      this.renderer.render(items, data.total);
    });

    this.setupSearch();
    this.setupSort();
    this.setupPriceFilter();
    this.setupReset();
    this.setupLoadMore();
    this.setupProductActions();
  }

  setupSearch() {
    const input = this.renderer.searchInput;
    if (!input) return;

    const debouncedSearch = DomUtils.debounce((value) => {
      this.service.updateFilters({ keyword: value.trim() });
    }, 300);

    input.addEventListener('input', (e) => {
      const keyword = e.target.value.trim();
      debouncedSearch(keyword);
      const results = this.service.products
        .filter(p => p.matchesKeyword(keyword))
        .slice(0, 5);
      this.renderer.renderSuggestions(keyword, results, (id) => {
        const product = this.service.getProductById(id);
        if (product) {
          this.service.updateFilters({ keyword: product.name });
          if (this.renderer.searchInput) this.renderer.searchInput.value = product.name;
          document.getElementById('search-suggestion')?.classList.add('hidden');
        }
      });
    });
  }

  setupSort() {
    const select = this.renderer.sortSelect;
    if (!select) return;
    select.addEventListener('change', (e) => {
      this.service.updateFilters({ sort: e.target.value });
    });
  }

  setupPriceFilter() {
    const slider = this.renderer.priceSlider;
    if (!slider) return;
    slider.addEventListener('input', (e) => {
      const value = Number(e.target.value);
      this.renderer.updatePriceDisplay(value);
      this.service.updateFilters({ maxPrice: value });
    });
  }

  setupReset() {
    const button = this.renderer.resetButton;
    if (!button) return;
    button.addEventListener('click', () => {
      this.resetFilters();
    });
  }

  setupLoadMore() {
    const container = this.renderer.loadMoreContainer;
    if (!container) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !container.classList.contains('hidden')) {
            this.loadMore();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(container);
    }

    const button = container.querySelector('#load-more-btn');
    if (button) {
      button.addEventListener('click', () => this.loadMore());
    }
  }

  setupProductActions() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      console.log('Product action clicked:', target.dataset.action, target.dataset.id);

      const action = target.dataset.action;
      const id = Number(target.dataset.id);

      if (action === 'add-to-cart') {
        e.stopPropagation();
        const product = this.service.getProductById(id);
        if (product && window.cartController) {
          const img = target.closest('.product-card')?.querySelector('img');
          window.cartController.addToCart(product, 1, img);
        }
      } else if (action === 'open-modal') {
        if (window.modalController) {
          window.modalController.open(id);
        }
      }
    });
  }

  loadMore() {
    if (this.isLoading) return;
    this.isLoading = true;
    const items = this.service.loadMore();
    this.renderer.append(items);
    setTimeout(() => { this.isLoading = false; }, 300);
  }

  resetFilters() {
    this.service.resetFilters();
    if (this.renderer.searchInput) this.renderer.searchInput.value = '';
    if (this.renderer.sortSelect) this.renderer.sortSelect.value = 'default';
    if (this.renderer.priceSlider) {
      this.renderer.priceSlider.value = 350000;
      this.renderer.updatePriceDisplay(350000);
    }
    const container = document.getElementById('search-suggestion');
    if (container) {
      container.classList.add('hidden');
      container.innerHTML = '';
    }
  }

  getProduct(id) {
    return this.service.getProductById(id);
  }
}