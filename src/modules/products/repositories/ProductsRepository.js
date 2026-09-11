import { Product } from "../../../shared/models/index.js";
import { apiService } from "../../../shared/services/api.service.js";

/**
 * ProductsRepository - lớp duy nhất trong app biết URL/shape JSON thật của
 * backend cho domain "products". Toàn bộ phần còn lại của app (Service,
 * Controller, Renderer) chỉ làm việc với ProductModel, không biết gì về HTTP.
 *
 * Lưu ý: repository này KHÔNG kế thừa BaseRepository nữa. BaseRepository được
 * thiết kế cho dữ liệu đồng bộ trong localStorage (findAll/findById trả về
 * giá trị ngay lập tức); còn dữ liệu sản phẩm giờ lấy qua mạng nên mọi method
 * đều là async/Promise. Kế thừa một base class có API đồng bộ trong khi
 * override toàn bộ method thành bất đồng bộ sẽ vi phạm Liskov Substitution
 * Principle, nên ở đây định nghĩa một contract async riêng, tường minh hơn.
 *
 * Endpoint tương ứng phía backend: src/modules/products/products.routes.ts
 */
export class ProductsRepository {
  constructor(api = apiService) {
    this.api = api;
  }

  /**
   * Lấy 1 trang sản phẩm theo bộ lọc.
   * Khớp với GET /api/products (xem getProductsQuerySchema phía backend).
   */
  async findPage({
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    keyword,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = {}) {
    const data = await this.api.get("/products", {
      page,
      limit,
      category,
      minPrice,
      maxPrice,
      keyword,
      sortBy,
      sortOrder,
    });

    return {
      products: data.products.map((item) => Product.fromJSON(item)),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  }

  /** GET /api/products/:id */
  async findById(id) {
    const data = await this.api.get(`/products/${id}`);
    return Product.fromJSON(data);
  }

  /** GET /api/products/slug/:slug */
  async findBySlug(slug) {
    const data = await this.api.get(`/products/slug/${slug}`);
    return Product.fromJSON(data);
  }

  /** GET /api/products/categories -> [{ name, count }] */
  async getCategories() {
    return this.api.get("/products/categories");
  }

  /** GET /api/products/search?q=... */
  async search(query, page = 1, limit = 12) {
    const data = await this.api.get("/products/search", {
      q: query,
      page,
      limit,
    });
    return {
      products: data.products.map((item) => Product.fromJSON(item)),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
  }
}
