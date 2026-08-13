import { describe, it, expect } from 'vitest';
import { CartItemModel } from '../../../../src/shared/models/CartItemModel.js';

describe('CartItemModel', () => {
  const productData = {
    id: 1,
    name: 'Test Product',
    color: 'White',
    price: 100000,
    image: 'test.jpg',
    filter: ''
  };

  it('should create cart item from product', () => {
    const item = new CartItemModel(productData, 2);
    expect(item.id).toBe(1);
    expect(item.name).toBe('Test Product');
    expect(item.quantity).toBe(2);
    expect(item.price).toBe(100000);
  });

  it('should calculate subtotal', () => {
    const item = new CartItemModel(productData, 3);
    expect(item.subtotal).toBe(300000);
  });

  it('should increment quantity', () => {
    const item = new CartItemModel(productData, 1);
    const newItem = item.increment(2);
    expect(newItem.quantity).toBe(3);
  });

  it('should decrement quantity', () => {
    const item = new CartItemModel(productData, 5);
    const newItem = item.decrement(2);
    expect(newItem.quantity).toBe(3);
  });

  it('should not decrement below 1', () => {
    const item = new CartItemModel(productData, 1);
    const newItem = item.decrement();
    expect(newItem.quantity).toBe(1);
  });

  it('should serialize to JSON', () => {
    const item = new CartItemModel(productData, 2);
    const json = item.toJSON();
    expect(json.id).toBe(1);
    expect(json.quantity).toBe(2);
    expect(json.subtotal).toBe(200000);
  });

  it('should deserialize from JSON', () => {
    const data = {
      ...productData,
      quantity: 3,
      subtotal: 300000
    };
    const item = CartItemModel.fromJSON(data);
    expect(item).toBeInstanceOf(CartItemModel);
    expect(item.quantity).toBe(3);
    expect(item.subtotal).toBe(300000);
  });
});