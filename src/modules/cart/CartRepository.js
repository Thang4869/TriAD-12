import { BaseRepository } from '../../core/base/BaseRepository.js';
import { storage } from '../../core/services/Storage.js';
import { CartItem } from '../../shared/models/index.js';

const CART_KEY = 'cart';

export class CartRepository extends BaseRepository {
    constructor() {
        super(storage, CART_KEY, CartItem);
    }

    findAll() {
        const data = this.storage.get(CART_KEY, []);
        return data.map(item => this.modelClass.fromJSON(item));
    }

    save(items) {
        const data = items.map(item => item.toJSON());
        this.storage.set(CART_KEY, data);
    }

    clear() {
        this.storage.remove(CART_KEY);
    }

    isEmpty() {
        return this.findAll().length === 0;
    }

    getCount() {
        const items = this.findAll();
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }
}