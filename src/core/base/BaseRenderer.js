export class BaseRenderer {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this._retryCount = 0;
    this._maxRetries = 2;
  }

  findContainer() {
    this.container = document.getElementById(this.containerId) || this.container;

    if (!this.container && this._retryCount < this._maxRetries) {
      this._retryCount++;
      setTimeout(() => this.findContainer(), 100);
    }
    return this.container;
  }

  render(data) {}
  renderEmpty() {}
  update(data) {}
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}