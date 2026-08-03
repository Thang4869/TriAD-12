// src/modules/reviews/reviews.service.js

const STORAGE_KEY = 'triad_reviews';

export class ReviewsService {
    constructor() {
        this.reviews = [];
        this.load();
    }

    /**
     * Lấy danh sách reviews từ localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            this.reviews = data ? JSON.parse(data) : [];
        } catch {
            this.reviews = [];
        }
        return this.reviews;
    }

    /**
     * Lưu reviews vào localStorage
     */
    save(reviews) {
        this.reviews = reviews;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    }

    /**
     * Lấy tất cả reviews
     */
    getAll() {
        return [...this.reviews];
    }

    /**
     * Lấy 3 review mới nhất
     */
    getLatest(limit = 3) {
        return [...this.reviews].reverse().slice(0, limit);
    }

    /**
     * Thêm review mới
     */
    add(reviewData) {
        const newReview = {
            id: this.generateId(),
            ...reviewData,
            createdAt: new Date().toISOString()
        };
        this.reviews.push(newReview);
        this.save(this.reviews);
        return newReview;
    }

    /**
     * Lấy thống kê
     */
    getStats() {
        if (this.reviews.length === 0) {
            return { total: 0, average: 0, averageDisplay: '0/5' };
        }
        const total = this.reviews.length;
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        return {
            total,
            average,
            averageDisplay: `${average.toFixed(1)}/5`
        };
    }

    /**
     * Tạo ID duy nhất
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Format ngày tháng
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
     * Lấy màu avatar dựa trên tên
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
     * Render sao
     */
    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="ph-fill ph-star text-yellow-400 text-sm"></i>`;
        }
        return stars;
    }
}