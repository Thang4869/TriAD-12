import { ProductModel } from "./ProductModel.js";

export class CartItemModel extends ProductModel {
  constructor(product, quantity = 1) {
    super(product);
    this._quantity = Math.max(1, quantity);
  }

  get quantity() {
    return this._quantity;
  }

  get subtotal() {
    return this._price * this._quantity;
  }

  get formattedSubtotal() {
    return this.subtotal.toLocaleString("vi-VN") + " ₫";
  }

  withQuantity(newQuantity) {
    if (newQuantity === this._quantity) return this;
    return new CartItemModel(this, newQuantity);
  }

  increment(amount = 1) {
    return this.withQuantity(this._quantity + amount);
  }

  decrement(amount = 1) {
    const newQuantity = Math.max(1, this._quantity - amount);
    return this.withQuantity(newQuantity);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      quantity: this._quantity,
      subtotal: this.subtotal,
    };
  }

  static fromJSON(data) {
    const product = ProductModel.fromJSON(data);
    return new CartItemModel(product, data.quantity || 1);
  }
}
