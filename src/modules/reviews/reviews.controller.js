/**
 * Reviews Controller - Handles reviews interactions
 */
export class ReviewsController {
    constructor() {
        console.log('⭐ Reviews Controller initialized');
        this.setupEventListeners();
        this.setupStarRating();
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
                // Update UI
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.className = 'ph-fill ph-star text-xl text-yellow-400 cursor-pointer';
                    } else {
                        s.className = 'ph ph-star text-xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
                    }
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
    }

    handleSubmit(e) {
        const form = e.target;
        const name = form.querySelector('input[type="text"]')?.value;
        const email = form.querySelector('input[type="email"]')?.value;
        const review = form.querySelector('textarea')?.value;
        const rating = document.querySelectorAll('.star-rating.ph-fill').length;

        if (!name || !review || rating === 0) {
            if (window.toast) {
                window.toast.warning('Missing Info', 'Please fill in all fields and select a rating.');
            }
            return;
        }

        // Simulate submission
        if (window.toast) {
            window.toast.success('Review Submitted!', 'Thank you for your feedback!');
        }
        
        form.reset();
        document.querySelectorAll('.star-rating').forEach(s => {
            s.className = 'ph ph-star text-xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
        });
        document.getElementById('selected-rating').textContent = '0/5';
    }
}