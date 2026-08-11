import { Logger } from '../../core/services/Logger.js';

export class BlogController {
    constructor() {
        Logger.debug('Blog Controller initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.blog-card');
            if (card) {
                e.preventDefault();
                const id = card.dataset.blogId;
                window.location.href = `blog-detail.html?id=${id}`;
            }
        });
    }
}