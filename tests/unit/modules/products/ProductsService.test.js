import { describe, it, expect, vi } from 'vitest';
import { ProductsService } from '../../../../src/modules/products/services/ProductsService';
import { Product } from '../../../../src/shared/models/index.js';

describe('ProductsService', () => {
  it('should filter products by keyword', () => {
    const mockRepo = {
      findAll: vi.fn().mockReturnValue([
        new Product({ id: 1, name: 'Glass Container', color: 'White', price: 150000 }),
        new Product({ id: 2, name: 'Thermo Mug', color: 'Black', price: 120000 }),
      ]),
    };
    const mockEventBus = { emit: vi.fn() };
    const service = new ProductsService(mockRepo, mockEventBus);
    service.load();
    service.updateFilters({ keyword: 'glass' });
    const filtered = service.getCurrentPage();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });
});