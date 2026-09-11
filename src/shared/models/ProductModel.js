import { APP_CONFIG } from "../../config/settings.config.js";

/**
 * ProductModel đóng vai trò "Anti-Corruption Layer" giữa response JSON
 * của backend (ProductCore - xem src/modules/products/products.mapper.ts
 * phía backend) và phần UI của frontend.
 *
 * Backend trả về: { id, name, description, price, stock, category, images[],
 *                    slug, isActive, avgRating, reviewCount, createdAt, updatedAt }
 *
 * UI hiện tại (ProductsRenderer, ModalController, CartRenderer...) vẫn dùng
 * `product.image` (số ít) và `product.color` từ bản seed dữ liệu cũ, nên các
 * getter dưới đây được giữ lại làm alias để không phải sửa lại toàn bộ HTML
 * template hiện có.
 */
export class ProductModel {
  constructor({
    id,
    name,
    price,
    description = "",
    stock = 0,
    category = "",
    images = [],
    slug = "",
    isActive = true,
    avgRating = 0,
    reviewCount = 0,
    createdAt = null,
    updatedAt = null,
    reviews = null,
    // Các field cũ (dữ liệu seed cục bộ trước đây) - vẫn nhận vào để không vỡ code cũ,
    // nhưng dữ liệu thật từ API sẽ không có các field này.
    color,
    image,
    filter = "",
  }) {
    this._id = id;
    this._name = name;
    this._price = price;
    this._description = description;
    this._stock = stock;
    this._category = category;
    this._images = images.length > 0 ? images : image ? [image] : [];
    this._slug = slug;
    this._isActive = isActive;
    this._avgRating = avgRating;
    this._reviewCount = reviewCount;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._reviews = reviews;
    // color không tồn tại ở backend thật -> dùng category làm nhãn hiển thị phụ.
    this._color = color ?? category;
    this._filter = filter;
  }

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get description() {
    return this._description;
  }
  get price() {
    return this._price;
  }
  get stock() {
    return this._stock;
  }
  get category() {
    return this._category;
  }
  get images() {
    return [...this._images];
  }
  get slug() {
    return this._slug;
  }
  get isActive() {
    return this._isActive;
  }
  get avgRating() {
    return this._avgRating;
  }
  get reviewCount() {
    return this._reviewCount;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  get reviews() {
    return this._reviews;
  }

  /** Alias tương thích ngược: ảnh đầu tiên trong mảng images[]. */
  get image() {
    return this._images[0] || APP_CONFIG.PLACEHOLDER_IMAGE;
  }

  /** Alias tương thích ngược: dùng category thay cho "color" (không còn ở backend). */
  get color() {
    return this._color;
  }

  get filter() {
    return this._filter;
  }

  get inStock() {
    return this._stock > 0;
  }

  get formattedPrice() {
    return this._price.toLocaleString("vi-VN") + " ₫";
  }

  get displayName() {
    return this._color ? `${this._name} - ${this._color}` : this._name;
  }

  get searchableText() {
    return `${this._name} ${this._category}`.toLowerCase();
  }

  matchesKeyword(keyword) {
    if (!keyword) return true;
    return this.searchableText.includes(keyword.toLowerCase());
  }

  matchesPriceRange(min, max) {
    return this._price >= min && this._price <= max;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      price: this._price,
      stock: this._stock,
      category: this._category,
      images: this._images,
      slug: this._slug,
      isActive: this._isActive,
      avgRating: this._avgRating,
      reviewCount: this._reviewCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromJSON(data) {
    return new ProductModel(data);
  }
}
