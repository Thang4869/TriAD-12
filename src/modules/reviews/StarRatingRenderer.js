export class StarRatingRenderer {
  constructor(containerSelector, displaySelector) {
    this.container = document.querySelector(containerSelector);
    this.display = document.querySelector(displaySelector);
    this.selectedRating = 0;
    this._init();
  }

  _init() {
    if (!this.container) return;
    const stars = this.container.querySelectorAll('.star-rating');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        this.selectedRating = index + 1;
        this._updateStars(index);
        if (this.display) this.display.textContent = `${this.selectedRating}/5`;
      });
      star.addEventListener('mouseenter', () => {
        this._updateStars(index);
      });
      star.addEventListener('mouseleave', () => {
        this._updateStars(this.selectedRating - 1);
      });
    });
  }

  _updateStars(index) {
    const stars = this.container.querySelectorAll('.star-rating');
    stars.forEach((s, i) => {
      s.className = i <= index
        ? 'ph-fill ph-star text-xl text-yellow-400 cursor-pointer'
        : 'ph ph-star text-xl text-gray-300 cursor-pointer hover:text-yellow-400 transition-colors';
    });
  }

  reset() {
    this.selectedRating = 0;
    this._updateStars(-1);
    if (this.display) this.display.textContent = '0/5';
  }

  getRating() {
    return this.selectedRating;
  }
}