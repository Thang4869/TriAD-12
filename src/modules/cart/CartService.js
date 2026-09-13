import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";
import { CartRepository } from "./CartRepository.js";

export class CartService {
  constructor(repository = new CartRepository()) {
    this.repository = repository;
    this.items = [];
  }

  async load() {
    try {
      this.items = await this.repository.getCart();
    } catch (error) {
      // Chưa đăng nhập (401) -> coi như giỏ trống, không phải lỗi cần báo cho user.
      this.items = [];
    }
    this.notify();
    return this.items;
  }

  async add(productId, quantity = 1) {
    this.items = await this.repository.addItem(productId, quantity);
    this.notify();
    eventBus.emit(EVENTS.CART_ITEM_ADDED, { productId, quantity });
    return this.items;
  }

  async remove(productId) {
    this.items = await this.repository.removeItem(productId);
    this.notify();
    eventBus.emit(EVENTS.CART_ITEM_REMOVED, { productId });
    return this.items;
  }

  async increase(productId) {
    const current = this.items.find((i) => i.id === productId);
    const newQuantity = (current?.quantity || 0) + 1;
    this.items = await this.repository.updateItem(productId, newQuantity);
    this.notify();
    return this.items;
  }

  async decrease(productId) {
    const current = this.items.find((i) => i.id === productId);
    if (!current) return this.items;
    const newQuantity = current.quantity - 1;
    this.items =
      newQuantity <= 0
        ? await this.repository.removeItem(productId)
        : await this.repository.updateItem(productId, newQuantity);
    this.notify();
    return this.items;
  }

  async clear() {
    await this.repository.clear();
    this.items = [];
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

  notify() {
    eventBus.emit(EVENTS.CART_UPDATED, {
      items: this.items,
      total: this.total,
      count: this.count,
      isEmpty: this.isEmpty,
    });
  }
}
