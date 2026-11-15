export class BaseRenderer {
  constructor(containerId) {
    this.containerId = containerId;
    this.container =
      typeof document !== "undefined"
        ? document.getElementById(containerId)
        : null;
    this._retryCount = 0;
    this._maxRetries = 2;
    this._retryTimer = null;
    this._destroyed = false;
  }

  findContainer() {
    if (this._destroyed || typeof document === "undefined") {
      this._clearRetryTimer();
      return null;
    }

    this.container =
      document.getElementById(this.containerId) || this.container;

    if (this.container) {
      this._clearRetryTimer();
      return this.container;
    }

    if (this._retryCount < this._maxRetries && this._retryTimer === null) {
      this._retryCount++;
      this._retryTimer = setTimeout(() => {
        this._retryTimer = null;
        if (!this._destroyed && typeof document !== "undefined") {
          this.findContainer();
        }
      }, 100);
    }

    return this.container;
  }

  _clearRetryTimer() {
    if (this._retryTimer !== null) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
    }
  }

  destroy() {
    this._destroyed = true;
    this._clearRetryTimer();
  }

  render(data) {}
  renderEmpty() {}
  update(data) {}
  clear() {
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}
