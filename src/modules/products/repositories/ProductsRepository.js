import { BaseRepository } from "../../../core/base/BaseRepository.js";
import { Product } from "../../../shared/models/index.js";
import { products as PRODUCTS_DATA } from "../../../config/products.config.js";

export class ProductsRepository extends BaseRepository {
  constructor(storage) {
    super(storage, "products", Product);
  }

  findAll() {
    const stored = this.storage.get(this.key);
    if (stored && stored.length > 0) {
      return stored.map((item) => this.modelClass.fromJSON(item));
    }
    const seed = PRODUCTS_DATA.map((p) => new this.modelClass(p));
    this.save(seed);
    return seed;
  }

  findByIds(ids) {
    const products = this.findAll();
    return products.filter((p) => ids.includes(p.id));
  }
}
