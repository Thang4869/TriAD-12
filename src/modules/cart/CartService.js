import { EVENTS } from "../../shared/constants/Events.js";
import { eventBus } from "../../core/services/EventBus.js";
import { CartRepository } from "./CartRepository.js";

const SESSION_CHANGED =
  "Phiên đăng nhập đã thay đổi. Vui lòng thử lại thao tác.";

export class CartService {
  constructor(repository = new CartRepository()) {
    this.repository = repository;
    this.items = [];
    this._sessionVersion = 0;
  }

  async load() {
    const version = this._sessionVersion;
    let items;
    try {
      items = await this.repository.getCart();
    } catch (error) {
      // Chưa đăng nhập (401) -> coi như giỏ trống, không phải lỗi cần báo cho user.
      items = [];
    }
    this._apply(items, version);
    return this.items;
  }

  async add(productId, quantity = 1) {
    const version = this._sessionVersion;
    const items = await this.repository.addItem(productId, quantity);
    if (!this._apply(items, version)) throw new Error(SESSION_CHANGED);
    eventBus.emit(EVENTS.CART_ITEM_ADDED, { productId, quantity });
    return this.items;
  }

  async remove(productId) {
    const version = this._sessionVersion;
    const items = await this.repository.removeItem(productId);
    if (!this._apply(items, version)) throw new Error(SESSION_CHANGED);
    eventBus.emit(EVENTS.CART_ITEM_REMOVED, { productId });
    return this.items;
  }

  async increase(productId) {
    const version = this._sessionVersion;
    const current = this.items.find((i) => i.id === productId);
    const newQuantity = (current?.quantity || 0) + 1;
    const items = await this.repository.updateItem(productId, newQuantity);
    if (!this._apply(items, version)) throw new Error(SESSION_CHANGED);
    return this.items;
  }

  async decrease(productId) {
    const version = this._sessionVersion;
    const current = this.items.find((i) => i.id === productId);
    if (!current) return this.items;
    const newQuantity = current.quantity - 1;
    const items =
      newQuantity <= 0
        ? await this.repository.removeItem(productId)
        : await this.repository.updateItem(productId, newQuantity);
    if (!this._apply(items, version)) throw new Error(SESSION_CHANGED);
    return this.items;
  }

  async clear() {
    const version = this._sessionVersion;
    await this.repository.clear();
    if (!this._apply([], version)) throw new Error(SESSION_CHANGED);
    eventBus.emit(EVENTS.CART_CLEARED);
    return this.items;
  }

  // Authentication changes clear only this view; the server cart is retained.
  reset() {
    this._sessionVersion += 1;
    this.items = [];
    this.notify();
    return this.items;
  }

  _apply(items, version) {
    if (version !== this._sessionVersion) return false;
    this.items = items;
    this.notify();
    return true;
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
