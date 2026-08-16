import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";
import { CartItem } from "../../shared/models/index.js";
import { CartRepository } from "./CartRepository.js";

export class CartService {
  constructor() {
    this.repository = new CartRepository();
    this.items = [];
    this.load();
  }

  load() {
    this.items = this.repository.findAll();
    this.notify();
    return this.items;
  }

  add(product, quantity = 1) {
    const existing = this.items.find((item) => item.id === product.id);

    if (existing) {
      const index = this.items.indexOf(existing);
      this.items[index] = existing.increment(quantity);
    } else {
      this.items.push(new CartItem(product, quantity));
    }

    this.save();
    eventBus.emit(EVENTS.CART_ITEM_ADDED, { product, quantity });

    return this.items;
  }

  remove(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.save();
    eventBus.emit(EVENTS.CART_ITEM_REMOVED, { id });
    return this.items;
  }

  increase(id) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return this.items;

    this.items[index] = this.items[index].increment();
    this.save();
    return this.items;
  }

  decrease(id) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return this.items;

    const newItem = this.items[index].decrement();
    if (newItem.quantity === 1 && this.items[index].quantity === 1) {
      this.items.splice(index, 1);
    } else {
      this.items[index] = newItem;
    }

    this.save();
    return this.items;
  }

  clear() {
    this.items = [];
    this.repository.clear();
    this.notify();
    eventBus.emit(EVENTS.CART_CLEARED);
    return this.items;
  }

  get total() {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get count() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  save() {
    this.repository.save(this.items);
    this.notify();
  }

  notify() {
    eventBus.emit(EVENTS.CART_UPDATED, {
      items: this.items,
      total: this.total,
      count: this.count,
      isEmpty: this.isEmpty,
    });
  }
}
