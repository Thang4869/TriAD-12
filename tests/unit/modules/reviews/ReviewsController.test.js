import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewsController } from '../../../../src/modules/reviews/ReviewsController.js';

vi.mock('../../../../src/modules/reviews/ReviewsService.js', () => ({
  ReviewsService: vi.fn().mockImplementation(() => ({
    getAll: vi.fn().mockReturnValue([]),
    getLatest: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({ total: 0, averageDisplay: '0/5' }),
    getAvatarColor: vi.fn().mockReturnValue('bg-blue-500'),
    getInitials: vi.fn().mockReturnValue('JD'),
    escapeHtml: vi.fn().mockImplementation(text => text),
    formatDate: vi.fn().mockReturnValue('Today'),
    renderStars: vi.fn().mockReturnValue('★★★★★'),
    add: vi.fn(),
  })),
}));

describe('ReviewsController', () => {
  let controller;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="reviews-grid"></div>
      <span id="avg-rating">0/5</span>
      <span id="total-reviews">(0 reviews)</span>
      <form id="review-form">
        <input id="review-name">
        <input id="review-email">
        <textarea id="review-content"></textarea>
        <div id="star-rating">
          <i class="star-rating" data-value="1"></i>
          <i class="star-rating" data-value="2"></i>
          <i class="star-rating" data-value="3"></i>
          <i class="star-rating" data-value="4"></i>
          <i class="star-rating" data-value="5"></i>
        </div>
        <span id="selected-rating">0/5</span>
        <button type="submit">Submit</button>
      </form>
    `;
    window.toast = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };
    controller = new ReviewsController();
  });

  it('should render reviews', () => {
    const mockReviews = [
      { id: '1', name: 'John', content: 'Great', rating: 5, createdAt: new Date().toISOString() },
    ];
    controller.service.getLatest = vi.fn().mockReturnValue(mockReviews);
    controller.service.getAll = vi.fn().mockReturnValue(mockReviews);
    controller.render();
    const grid = document.getElementById('reviews-grid');
    expect(grid.innerHTML).toContain('John');
    expect(grid.innerHTML).toContain('Great');
  });

  it('should render empty state', () => {
    controller.service.getAll = vi.fn().mockReturnValue([]);
    controller.render();
    const grid = document.getElementById('reviews-grid');
    expect(grid.innerHTML).toContain('No reviews yet');
  });

  it('should update stats', () => {
    controller.service.getStats = vi.fn().mockReturnValue({ total: 10, averageDisplay: '4.5/5' });
    controller.updateStats([]);
    expect(document.getElementById('avg-rating').textContent).toBe('4.5/5');
    expect(document.getElementById('total-reviews').textContent).toBe('(10 reviews)');
  });

  it('should handle form submit with valid data', () => {
    document.getElementById('review-name').value = 'Alice';
    document.getElementById('review-content').value = 'Good product';
    const stars = document.querySelectorAll('.star-rating');
    stars[4].click();
    const form = document.getElementById('review-form');
    form.dispatchEvent(new Event('submit'));
    expect(window.toast.success).toHaveBeenCalled();
  });

  it('should show warning if name missing', () => {
    document.getElementById('review-content').value = 'Good';
    const form = document.getElementById('review-form');
    form.dispatchEvent(new Event('submit'));
    expect(window.toast.warning).toHaveBeenCalledWith('Warning', 'Please enter your name.');
  });
});