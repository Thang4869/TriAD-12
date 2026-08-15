import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewsService } from '../../../../src/modules/reviews/ReviewsService.js';

describe('ReviewsService', () => {
  let service;

  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    global.localStorage = localStorageMock;
    service = new ReviewsService();
  });

  it('should load reviews from storage', () => {
    const mockReviews = [{ id: '1', name: 'John', content: 'Great', rating: 5 }];
    localStorage.getItem.mockReturnValue(JSON.stringify(mockReviews));
    const reviews = service.load();
    expect(reviews.length).toBe(1);
    expect(reviews[0].name).toBe('John');
  });

  it('should add review', () => {
    const review = service.add({ name: 'Alice', content: 'Good', rating: 4 });
    expect(review.id).toBeDefined();
    expect(service.getAll().length).toBe(1);
  });

  it('should get stats', () => {
    service.add({ name: 'A', content: '1', rating: 5 });
    service.add({ name: 'B', content: '2', rating: 4 });
    const stats = service.getStats();
    expect(stats.total).toBe(2);
    expect(stats.average).toBe(4.5);
    expect(stats.averageDisplay).toBe('4.5/5');
  });

  it('should get latest reviews', () => {
    service.add({ name: 'A', content: '1', rating: 5 });
    service.add({ name: 'B', content: '2', rating: 4 });
    service.add({ name: 'C', content: '3', rating: 3 });
    const latest = service.getLatest(2);
    expect(latest.length).toBe(2);
    expect(latest[0].name).toBe('C');
  });

  it('should format date', () => {
    const now = new Date();
    const result = service.formatDate(now.toISOString());
    expect(result).toBe('Today');
  });

  it('should generate avatar color', () => {
    const color = service.getAvatarColor('John');
    expect(color).toMatch(/^bg-/);
  });

  it('should get initials', () => {
    expect(service.getInitials('John Doe')).toBe('JD');
    expect(service.getInitials('Jane')).toBe('J');
  });

  it('should escape HTML', () => {
    expect(service.escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('ReviewsService - additional coverage', () => {
  let service;
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    global.localStorage = mockLocalStorage;
    service = new ReviewsService();
  });

  it('load should gracefully fallback when localStorage throws error', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    const result = service.load();
    expect(result).toEqual([]);
    expect(service.reviews).toEqual([]);
  });

  it('getStats should return safe values when reviews array is empty', () => {
    service.reviews = [];
    const stats = service.getStats();
    expect(stats).toEqual({
      total: 0,
      average: 0,
      averageDisplay: '0/5'
    });
  });

  it('getStats should calculate average correctly for non-empty array', () => {
    service.reviews = [
      { rating: 5 },
      { rating: 4 },
      { rating: 3 }
    ];
    const stats = service.getStats();
    expect(stats.total).toBe(3);
    expect(stats.average).toBe(4);
    expect(stats.averageDisplay).toBe('4.0/5');
  });

  it('generateId should produce unique strings', () => {
    const id1 = service.generateId();
    const id2 = service.generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(5);
    expect(id2.length).toBeGreaterThan(5);
  });

  it('formatDate should handle various time differences', () => {
    const now = new Date();
    expect(service.formatDate(now.toISOString())).toBe('Today');

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(service.formatDate(yesterday.toISOString())).toBe('Yesterday');

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    expect(service.formatDate(weekAgo.toISOString())).toBe('1 weeks ago');

    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    expect(service.formatDate(monthAgo.toISOString())).toBe('1 months ago');

    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    expect(service.formatDate(yearAgo.toISOString())).toBe('1 years ago');
  });
});