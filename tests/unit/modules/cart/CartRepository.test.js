import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartRepository } from '../../../../src/modules/cart/CartRepository.js';
import { CartItemModel } from '../../../../src/shared/models/CartItemModel.js';

vi.mock('../../../../src/core/services/Storage.js', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}));

import { storage } from '../../../../src/core/services/Storage.js';

describe('CartRepository', () => {
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CartRepository();
  });

  it('should find all items', () => {
    const mockData = [
      { id: 1, name: 'Product 1', color: 'White', price: 100000, image: '1.jpg', quantity: 2 },
      { id: 2, name: 'Product 2', color: 'Black', price: 150000, image: '2.jpg', quantity: 1 }
    ];
    storage.get.mockReturnValue(mockData);

    const items = repository.findAll();
    expect(items.length).toBe(2);
    expect(items[0]).toBeInstanceOf(CartItemModel);
    expect(items[0].id).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should save items', () => {
    const items = [
      new CartItemModel({ id: 1, name: 'Product', color: 'White', price: 100000, image: '1.jpg' }, 2)
    ];
    repository.save(items);
    expect(storage.set).toHaveBeenCalledWith('cart', expect.any(Array));
  });

  it('should clear cart', () => {
    repository.clear();
    expect(storage.remove).toHaveBeenCalledWith('cart');
  });

  it('should check if cart is empty', () => {
    storage.get.mockReturnValue([]);
    expect(repository.isEmpty()).toBe(true);

    storage.get.mockReturnValue([{ id: 1, quantity: 1 }]);
    expect(repository.isEmpty()).toBe(false);
  });

  it('should get item count', () => {
    storage.get.mockReturnValue([
      { id: 1, quantity: 2 },
      { id: 2, quantity: 3 }
    ]);
    expect(repository.getCount()).toBe(5);
  });
});