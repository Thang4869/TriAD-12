import { EVENTS } from "../../../shared/constants/Events.js";

/**
 * ProductsService - trước đây tải TOÀN BỘ sản phẩm vào bộ nhớ rồi lọc/sort/
 * phân trang bằng JavaScript thuần. Giờ backend đã hỗ trợ lọc/sort/phân trang
 * thật (xem CatalogService.findAll phía backend, giới hạn tối đa 50 item/trang
 * - PAGINATION_DEFAULTS.MAX_LIMIT), nên service này gọi lại backend mỗi khi
 * filter thay đổi thay vì filter mảng có sẵn. Điều này đúng với cách một
 * catalog thật (vài nghìn sản phẩm) cần hoạt động.
 *
 * `this.products` luôn là danh sách các sản phẩm ĐÃ tải (dồn từ trang 1 tới
 * trang hiện tại) để phục vụ "Load more" và gợi ý tìm kiếm tức thời.
 */
export class ProductsService {
  constructor(repository, eventBus) {
    this.repository = repository;
    this.eventBus = eventBus;
    this.products = [];
    this.filters = this.getDefaultFilters();
    this.page = 1;
    this.totalPages = 1;
    this.total = 0;
    this.pageSize = 12;
  }

  getDefaultFilters() {
    return {
      keyword: "",
      minPrice: 0,
      maxPrice: 350000,
      sort: "default",
    };
  }

  _sortParams(sort) {
    switch (sort) {
      case "price-asc":
        return { sortBy: "price", sortOrder: "asc" };
      case "price-desc":
        return { sortBy: "price", sortOrder: "desc" };
      case "name-asc":
        return { sortBy: "name", sortOrder: "asc" };
      case "name-desc":
        return { sortBy: "name", sortOrder: "desc" };
      default:
        return { sortBy: "createdAt", sortOrder: "desc" };
    }
  }

  _queryParams(page) {
    const { keyword, minPrice, maxPrice, sort } = this.filters;
    const { sortBy, sortOrder } = this._sortParams(sort);
    return {
      page,
      limit: this.pageSize,
      keyword: keyword || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sortBy,
      sortOrder,
    };
  }

  /** Tải trang đầu tiên - dùng khi khởi động app. */
  async load() {
    return this._replace(1);
  }

  /** Tải lại từ trang 1 (dùng cho load()/updateFilters()/resetFilters()) - thay toàn bộ danh sách. */
  async _replace(page) {
    this.eventBus.emit(EVENTS.PRODUCTS_LOADING, { loading: true });
    try {
      const result = await this.repository.findPage(this._queryParams(page));
      this.products = result.products;
      this.page = result.page;
      this.totalPages = result.totalPages;
      this.total = result.total;

      this.eventBus.emit(EVENTS.PRODUCTS_LOADED, { count: this.total });
      this.eventBus.emit(EVENTS.PRODUCTS_FILTERED, {
        total: this.total,
        filters: this.filters,
      });
      return this.products;
    } finally {
      this.eventBus.emit(EVENTS.PRODUCTS_LOADING, { loading: false });
    }
  }

  getCurrentPage() {
    return this.products;
  }

  get hasMore() {
    return this.page < this.totalPages;
  }

  get totalCount() {
    return this.total;
  }

  /**
   * Tải thêm trang kế tiếp và NỐI vào danh sách hiện có.
   * Trả về chỉ những sản phẩm MỚI (không phải toàn bộ danh sách), để
   * ProductsController có thể append đúng vào DOM mà không render trùng lặp.
   */
  async loadMore() {
    if (!this.hasMore) return [];
    const nextPage = this.page + 1;
    const result = await this.repository.findPage(this._queryParams(nextPage));

    this.products = [...this.products, ...result.products];
    this.page = result.page;
    this.totalPages = result.totalPages;
    this.total = result.total;

    return result.products;
  }

  async updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    return this._replace(1);
  }

  async resetFilters() {
    this.filters = this.getDefaultFilters();
    return this._replace(1);
  }

  /**
   * Tìm trong danh sách ĐÃ TẢI (không gọi API). Đủ dùng cho modal chi tiết
   * sản phẩm vì modal chỉ mở từ một card đang hiển thị trên trang.
   */
  getProductById(id) {
    return this.products.find((p) => p.id === id) || null;
  }
}
