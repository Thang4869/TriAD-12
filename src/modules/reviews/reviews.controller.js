/**
 * Reviews Controller - Handles reviews interactions
 * 
 * Now with localStorage persistence
 */
const STORAGE_KEY = 'triad_reviews';

export class ReviewsController {
    constructor() {
        console.log('⭐ Reviews Controller initialized');
        this.setupEventListeners();
        this.setupStarRating();
        this.loadReviews();
    }

    /**
     * Load và render reviews từ localStorage
     */
    loadReviews() {
        const reviews = this.getReviews();
        this.renderReviews(reviews);
        this.updateStats(reviews);
    }

    /**
     * Lấy reviews từ localStorage
     */
    getReviews() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    /**
     * Lưu reviews vào localStorage
     */
    saveReviews(reviews) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
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
        const sorted = [...reviews].reverse().slice(0, 3);
        
        grid.innerHTML = sorted.map(review => `
            <div class="bg-gray-50 p-6 rounded-2xl hover:shadow-md transition-all">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-full ${this.getAvatarColor(review.name)} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm flex-shrink-0">
                        ${this.getInitials(review.name)}
                    </div>
                    <div>
                        <h4 class="font-semibold">${this.escapeHtml(review.name)}</h4>
                        <div class="flex items-center gap-1">
                            ${this.renderStars(review.rating)}
                        </div>
                    </div>
                </div>
                <p class="text-brand-gray text-sm leading-relaxed">"${this.escapeHtml(review.content)}"</p>
                <div class="mt-3 text-xs text-brand-gray">
                    <span>Verified Purchase</span>
                    <span class="mx-2">•</span>
                    <span>${this.formatDate(review.createdAt)}</span>
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
        
        if (reviews.length === 0) {
            if (avgEl) avgEl.textContent = '0/5';
            if (totalEl) totalEl.textContent = '(0 reviews)';
            return;
        }

        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = (sum / total).toFixed(1);
        
        if (avgEl) avgEl.textContent = `${avg}/5`;
        if (totalEl) totalEl.textContent = `(${total} reviews)`;
    }

    /**
     * Render sao
     */
    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="ph-fill ph-star text-yellow-400 text-sm"></i>`;
        }
        return stars;
    }

    /**
     * Lấy màu avatar
     */
    getAvatarColor(name) {
        const colors = [
            'bg-brand-accent',
            'bg-brand-orange',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-blue-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Lấy chữ cái đầu
     */
    getInitials(name) {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
        if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
        return `${Math.floor(diff / 365)} years ago`;
    }

    /**
     * Tạo ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    setupEventListeners() {
        const form = document.getElementById('review-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(e);
            });
        }
    }

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

        // Tạo review mới
        const newReview = {
            id: this.generateId(),
            name: name,
            email: email || '',
            content: content,
            rating: rating,
            createdAt: new Date().toISOString()
        };

        // Lưu
        const reviews = this.getReviews();
        reviews.push(newReview);
        this.saveReviews(reviews);

        // Reset form
        form.reset();
        if (this._resetRating) {
            this._resetRating();
        }

        // Re-render
        this.loadReviews();

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

        // Fallback
        const colors = {
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
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
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
}