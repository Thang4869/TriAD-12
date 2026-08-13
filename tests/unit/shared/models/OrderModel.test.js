import { describe, it, expect } from 'vitest';
import { OrderModel } from '../../../../src/shared/models/OrderModel.js';

describe('OrderModel', () => {
  const mockItems = [
    { id: 1, name: 'Product 1', price: 100000, quantity: 2, subtotal: 200000 },
    { id: 2, name: 'Product 2', price: 150000, quantity: 1, subtotal: 150000 }
  ];

  it('should create order', () => {
    const order = new OrderModel({
      items: mockItems,
      customer: { name: 'John Doe', email: 'john@example.com' },
      paymentMethod: 'cod',
      total: 350000
    });
    
    expect(order.id).toBeDefined();
    expect(order.items.length).toBe(2);
    expect(order.customer.name).toBe('John Doe');
    expect(order.paymentMethod).toBe('cod');
  });

  it('should calculate total', () => {
    const order = new OrderModel({
      items: mockItems,
      total: 350000
    });
    expect(order.total).toBe(350000);
  });

  it('should calculate item count', () => {
    const order = new OrderModel({
      items: mockItems,
      total: 350000
    });
    expect(order.itemCount).toBe(3);
  });

  it('should generate order ID', () => {
    const order = new OrderModel({ items: [], total: 0 });
    expect(order.id).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
  });

  it('should serialize to JSON', () => {
    const order = new OrderModel({
      items: mockItems,
      customer: { name: 'John' },
      paymentMethod: 'cod',
      status: 'pending'
    });
    const json = order.toJSON();
    expect(json.id).toBe(order.id);
    expect(json.items.length).toBe(2);
    expect(json.total).toBe(350000);
  });

  it('should deserialize from JSON', () => {
    const data = {
      id: 'ORD-TEST-123',
      items: mockItems,
      customer: { name: 'John' },
      paymentMethod: 'cod',
      status: 'pending',
      createdAt: new Date().toISOString(),
      total: 350000
    };
    const order = OrderModel.fromJSON(data);
    expect(order).toBeInstanceOf(OrderModel);
    expect(order.id).toBe('ORD-TEST-123');
    expect(order.total).toBe(350000);
  });
});