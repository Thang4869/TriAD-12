import { BaseRepository } from '../../core/base/BaseRepository.js';
import { storage } from '../../core/services/Storage.js';
import { Product } from '../../shared/models/index.js';
import { products as PRODUCTS_DATA } from '../../config/products.config.js';

const PRODUCTS_KEY = 'products';

export class ProductsRepository extends BaseRepository {
    constructor() {
        super(storage, PRODUCTS_KEY, Product);
    }

    findAll() {
        const stored = this.storage.get(this.key);
        if (stored && stored.length > 0) {
            return stored.map(p => this.modelClass.fromJSON(p));
        }

        if (PRODUCTS_DATA.length > 0) {
            this.storage.set(this.key, PRODUCTS_DATA);
            return PRODUCTS_DATA.map(p => this.modelClass.fromJSON(p));
        }

        return [];
    }

    findByIds(ids) {
        const products = this.findAll();
        return products.filter(p => ids.includes(p.id));
    }
}