// src/modules/reviews/reviews.controller.js

import { ReviewsService } from './reviews.service.js';
import { toast } from '../toast/toast.service.js';

export class ReviewsController {
    constructor() {
        this.service = new ReviewsService();
        console.log('Reviews Controller initialized');
        this.setupEventListeners();
        this.setupStarRating();
        this.render();
    }

    /**
     * Render reviews
     */
    render() {
        const reviews = this.service.getAll();
        this.renderReviews(reviews);
        this.updateStats(reviews);
    }

    /**
     * Render reviews lên grid
     */
    renderReviews(reviews) {
        const grid = document.getElementById('reviews-grid');
        if (!grid) return;

        if (reviews.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="ph ph-chat-circle text-6xl text-gray-300"></i>
                    <p class="mt-4 text-gray-500">No reviews yet. Be the first to share your experience!</p>
                </div>
            `;
            return;
        }

        // Lấy 3 review mới nhất
        const latest = this.service.getLatest(3);
        
        grid.innerHTML = latest.map(review => `
            <div class="bg-gray-50 p-6 rounded-2xl hover:shadow-md transition-all">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-full ${this.service.getAvatarColor(review.name)} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm flex-shrink-0">
                        ${this.service.getInitials(review.name)}
                    </div>
                    <div>
                        <h4 class="font-semibold">${this.service.escapeHtml(review.name)}</h4>
                        <div class="flex items-center gap-1">
                            ${this.service.renderStars(review.rating)}
                        </div>
                    </div>
                </div>
                <p class="text-brand-gray text-sm leading-relaxed">"${this.service.escapeHtml(review.content)}"</p>
                <div class="mt-3 text-xs text-brand-gray">
                    <span>Verified Purchase</span>
                    <span class="mx-2">•</span>
                    <span>${this.service.formatDate(review.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Cập nhật thống kê
     */
    updateStats(reviews) {
        const avgEl = document.getElementById('avg-rating');
        const totalEl = document.getElementById('total-reviews');
        
        const stats = this.service.getStats();
        
        if (avgEl) avgEl.textContent = stats.averageDisplay;
        if (totalEl) totalEl.textContent = `(${stats.total} reviews)`;
    }

    /**
     * Setup sự kiện cho form
     */
    setupEventListeners() {
        const form = document.getElementById('review-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(e);
            });
        }
    }

    /**
     * Setup star rating
     */
    setupStarRating() {
        const stars = document.querySelectorAll('.star-rating');
        const ratingDisplay = document.getElementById('selected-rating');
        let selectedRating = 0;

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                stars.forEach((s, i) => {
                    s.className = i <= index 
                        ? 'ph-fill ph-star text-xl text-yellow-400 cursor-pointer'
                        : 'ph ph-star text-xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
                });
                if (ratingDisplay) {
                    ratingDisplay.textContent = `${selectedRating}/5`;
                }
            });

            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.className = 'ph-fill ph-star text-xl text-yellow-400 cursor-pointer';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach((s, i) => {
                    if (i >= selectedRating) {
                        s.className = 'ph ph-star text-xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
                    }
                });
            });
        });

        // Lưu rating vào form
        this._selectedRating = () => selectedRating;
        this._resetRating = () => {
            selectedRating = 0;
            stars.forEach(s => {
                s.className = 'ph ph-star text-xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
            });
            if (ratingDisplay) {
                ratingDisplay.textContent = '0/5';
            }
        };
    }

    /**
     * Xử lý submit form
     */
    handleSubmit(e) {
        const form = e.target;
        const name = document.getElementById('review-name')?.value.trim();
        const email = document.getElementById('review-email')?.value.trim();
        const content = document.getElementById('review-content')?.value.trim();
        const rating = this._selectedRating ? this._selectedRating() : 0;

        // Validation
        if (!name) {
            this.showToast('Please enter your name.', 'warning');
            return;
        }
        if (!content) {
            this.showToast('Please write your review.', 'warning');
            return;
        }
        if (rating === 0) {
            this.showToast('Please select a rating.', 'warning');
            return;
        }

        // Thêm review mới
        this.service.add({
            name,
            email: email || '',
            content,
            rating
        });

        // Reset form
        form.reset();
        if (this._resetRating) {
            this._resetRating();
        }

        // Re-render
        this.render();

        // Thông báo
        this.showToast('Review submitted successfully! Thank you for your feedback.', 'success');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (window.toast) {
            const typeMap = {
                success: 'success',
                warning: 'warning',
                error: 'error',
                info: 'info'
            };
            const titleMap = {
                success: 'Success',
                warning: 'Warning',
                error: 'Error',
                info: 'Info'
            };
            window.toast[typeMap[type] || 'info'](titleMap[type] || 'Info', message);
            return;
        }

        // Fallback nếu toast không có sẵn
        const colors = {
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };

        const toastEl = document.createElement('div');
        toastEl.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            z-index: 9999;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 420px;
        `;
        toastEl.textContent = message;
        document.body.appendChild(toastEl);

        requestAnimationFrame(() => {
            toastEl.style.transform = 'translateY(0)';
            toastEl.style.opacity = '1';
        });

        setTimeout(() => {
            toastEl.style.transform = 'translateY(20px)';
            toastEl.style.opacity = '0';
            setTimeout(() => toastEl.remove(), 300);
        }, 3500);
    }
}