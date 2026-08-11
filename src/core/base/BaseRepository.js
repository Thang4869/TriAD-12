export class BaseRepository {
  constructor(storage, key, modelClass) {
    this.storage = storage;
    this.key = key;
    this.modelClass = modelClass;
  }

  findAll() {
    const data = this.storage.get(this.key, []);
    return data.map(item => this.modelClass.fromJSON(item));
  }

  findById(id) {
    const items = this.findAll();
    return items.find(item => item.id === id) || null;
  }

  save(items) {
    const data = items.map(item => item.toJSON());
    this.storage.set(this.key, data);
  }

  clear() {
    this.storage.remove(this.key);
  }

  count() {
    return this.findAll().length;
  }
}