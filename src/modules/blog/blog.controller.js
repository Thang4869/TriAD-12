/**
 * Blog Controller - Handles blog interactions
 */
export class BlogController {
    constructor() {
        console.log('Blog Controller initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Click on blog cards to navigate to detail
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.blog-card');
            if (card) {
                e.preventDefault();
                const id = card.dataset.blogId;
                window.location.href = `./pages/blog-detail.html?id=${id}`;
            }
        });
    }
}