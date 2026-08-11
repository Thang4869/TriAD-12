import { EVENTS } from '../../../shared/constants/Events.js';

export class ProductsService {
  /**
   * @param {ProductsRepository} repository
   * @param {EventBus} eventBus
   */
  constructor(repository, eventBus) {
    this.repository = repository;
    this.eventBus = eventBus;
    this.products = [];
    this.filteredProducts = [];
    this.filters = this.getDefaultFilters();
    this.page = 1;
    this.pageSize = 12;
  }

  getDefaultFilters() {
    return {
      keyword: '',
      minPrice: 0,
      maxPrice: 350000,
      sort: 'default'
    };
  }

  load() {
    this.products = this.repository.findAll();
    this.filteredProducts = [...this.products];
    this.applyFilters();
    this.eventBus.emit(EVENTS.PRODUCTS_LOADED, { count: this.products.length });
    return this.filteredProducts;
  }

  applyFilters() {
    const { keyword, minPrice, maxPrice, sort } = this.filters;

    this.filteredProducts = this.products.filter(product => {
      const matchKeyword = !keyword || product.matchesKeyword(keyword);
      const matchPrice = product.matchesPriceRange(minPrice, maxPrice);
      return matchKeyword && matchPrice;
    });

    this.applySort(sort);
    this.page = 1;

    this.eventBus.emit(EVENTS.PRODUCTS_FILTERED, {
      total: this.filteredProducts.length,
      filters: this.filters
    });

    return this.filteredProducts;
  }

  applySort(sort) {
    switch (sort) {
      case 'price-asc':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: break;
    }
  }

  getCurrentPage() {
    const start = 0;
    const end = this.page * this.pageSize;
    return this.filteredProducts.slice(start, end);
  }

  get hasMore() {
    return this.filteredProducts.length > this.page * this.pageSize;
  }

  loadMore() {
    if (!this.hasMore) return this.getCurrentPage();
    this.page++;
    return this.getCurrentPage();
  }

  get totalCount() {
    return this.filteredProducts.length;
  }

  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.applyFilters();
    return this.filteredProducts;
  }

  resetFilters() {
    this.filters = this.getDefaultFilters();
    this.applyFilters();
    return this.filteredProducts;
  }

  getProductById(id) {
    return this.repository.findById(id);
  }
}