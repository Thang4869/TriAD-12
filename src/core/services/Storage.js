export class StorageService {
  constructor(prefix = "triad_") {
    this.prefix = prefix;
    this._memory = new Map();
  }

  _isAvailable() {
    try {
      localStorage.setItem("_test_", "test");
      localStorage.removeItem("_test_");
      return true;
    } catch {
      return false;
    }
  }

  _getFullKey(key) {
    return this.prefix + key;
  }

  get(key, defaultValue = null) {
    const fullKey = this._getFullKey(key);

    if (this._isAvailable()) {
      try {
        const data = localStorage.getItem(fullKey);
        return data ? JSON.parse(data) : defaultValue;
      } catch {
        return defaultValue;
      }
    }

    return this._memory.has(fullKey) ? this._memory.get(fullKey) : defaultValue;
  }

  set(key, value) {
    const fullKey = this._getFullKey(key);

    if (this._isAvailable()) {
      try {
        localStorage.setItem(fullKey, JSON.stringify(value));
        return true;
      } catch {
        this._memory.set(fullKey, value);
        return false;
      }
    }

    this._memory.set(fullKey, value);
    return true;
  }

  remove(key) {
    const fullKey = this._getFullKey(key);

    if (this._isAvailable()) {
      try {
        localStorage.removeItem(fullKey);
      } catch {}
    }

    this._memory.delete(fullKey);
  }

  clear() {
    if (this._isAvailable()) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
    }

    this._memory.clear();
  }

  keys() {
    const result = [];

    if (this._isAvailable()) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            result.push(key.substring(this.prefix.length));
          }
        });
      } catch {}
    }

    this._memory.forEach((_, key) => {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.substring(this.prefix.length);
        if (!result.includes(cleanKey)) {
          result.push(cleanKey);
        }
      }
    });

    return result;
  }
}

export const storage = new StorageService();
