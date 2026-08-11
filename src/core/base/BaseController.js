export class BaseController {
  constructor(service, renderer) {
    this.service = service;
    this.renderer = renderer;
    this._isInitialized = false;
    this._eventSubscriptions = [];
  }

  initialize() {
    if (this._isInitialized) return;
    this.setupEventListeners();
    this._isInitialized = true;
  }

  setupEventListeners() {}

  destroy() {
    this._eventSubscriptions.forEach(unsubscribe => unsubscribe());
    this._eventSubscriptions = [];
    this._isInitialized = false;
  }

  subscribe(event, callback) {
    const unsubscribe = window.eventBus.on(event, callback);
    this._eventSubscriptions.push(unsubscribe);
    return unsubscribe;
  }
}