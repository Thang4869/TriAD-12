export class BaseService {
  constructor(repository) {
    this.repository = repository;
    this._items = [];
    this._loaded = false;
  }

  load() {
    if (this._loaded) return this._items;
    this._items = this.repository.findAll();
    this._loaded = true;
    return this._items;
  }

  findAll() {
    return this._items;
  }

  findById(id) {
    return this._items.find(item => item.id === id) || null;
  }

  save(items) {
    this._items = items;
    this.repository.save(items);
    this.notify();
    return this._items;
  }

  clear() {
    this._items = [];
    this.repository.clear();
    this.notify();
  }

  notify() {}

  get count() {
    return this._items.length;
  }
}