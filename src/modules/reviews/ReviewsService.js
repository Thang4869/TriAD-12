const STORAGE_KEY = "triad_reviews";

export class ReviewsService {
  constructor() {
    this.reviews = [];
    this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      this.reviews = data ? JSON.parse(data) : [];
    } catch {
      this.reviews = [];
    }
    return this.reviews;
  }

  save(reviews) {
    this.reviews = reviews;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }

  getAll() {
    return [...this.reviews];
  }

  getLatest(limit = 3) {
    return [...this.reviews].reverse().slice(0, limit);
  }

  add(reviewData) {
    const newReview = {
      id: this.generateId(),
      ...reviewData,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(newReview);
    this.save(this.reviews);
    return newReview;
  }

  getStats() {
    if (this.reviews.length === 0) {
      return { total: 0, average: 0, averageDisplay: "0/5" };
    }
    const total = this.reviews.length;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;
    return {
      total,
      average,
      averageDisplay: `${average.toFixed(1)}/5`,
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)} years ago`;
  }

  getAvatarColor(name) {
    const colors = [
      "bg-brand-accent",
      "bg-brand-orange",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-blue-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(name) {
    const parts = name.split(" ").filter((w) => w.length > 0);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  renderStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="ph-fill ph-star text-yellow-400 text-sm"></i>`;
    }
    return stars;
  }
}
