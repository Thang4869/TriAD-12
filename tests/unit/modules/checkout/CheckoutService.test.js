import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutService } from '../../../../src/modules/checkout/CheckoutService.js';
import { Order } from '../../../../src/shared/models/index.js';

vi.mock('../../../../src/core/services/Storage.js', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

import { storage } from '../../../../src/core/services/Storage.js';

describe('CheckoutService', () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockReturnValue([]);
    service = new CheckoutService();
  });

  it('should load orders', () => {
    const mockOrders = [
      { id: 'ORD-1', items: [], customer: {}, total: 100000 },
      { id: 'ORD-2', items: [], customer: {}, total: 200000 }
    ];
    storage.get.mockReturnValue(mockOrders);
    
    const orders = service.loadOrders();
    expect(orders.length).toBe(2);
    expect(orders[0]).toBeInstanceOf(Order);
  });

  it('should create order', () => {
    const orderData = {
      items: [],
      customer: { name: 'John Doe' },
      total: 100000
    };
    
    const order = service.createOrder(orderData);
    expect(order).toBeInstanceOf(Order);
    expect(service.getOrders().length).toBe(1);
  });

  it('should get order by id', () => {
    const orderData = { items: [], customer: { name: 'John' }, total: 100000 };
    const order = service.createOrder(orderData);
    
    const found = service.getOrderById(order.id);
    expect(found).toBe(order);
    
    const notFound = service.getOrderById('invalid-id');
    expect(notFound).toBe(null);
  });

  it('should process checkout', () => {
    const formData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0123456789',
      address: '123 Main St',
      paymentMethod: 'cod'
    };
    
    const cartItems = [
      { 
        id: 1, 
        name: 'Product', 
        price: 100000, 
        quantity: 2, 
        subtotal: 200000,
        image: 'test.jpg',
        color: 'White',
        filter: ''
      }
    ];
    
    const order = service.processCheckout(formData, cartItems);
    expect(order).toBeInstanceOf(Order);
    expect(order.customer.firstName).toBe('John');
    expect(order.total).toBe(200000);
  });
});