export class EventBus {
  constructor() {
    this._events = new Map();
    this._onceEvents = new Map();
  }

  on(event, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    const entry = { callback, context };
    this._events.get(event).push(entry);

    return () => this.off(event, callback, context);
  }

  once(event, callback, context = null) {
    const wrapper = (data) => {
      callback.call(context, data);
      this.off(event, wrapper);
    };

    if (!this._onceEvents.has(event)) {
      this._onceEvents.set(event, []);
    }
    this._onceEvents.get(event).push(wrapper);

    return this.on(event, wrapper);
  }

  off(event, callback, context = null) {
    if (!this._events.has(event)) return;

    const entries = this._events.get(event);
    const filtered = entries.filter(entry => {
      if (context !== null) {
        return !(entry.callback === callback && entry.context === context);
      }
      return entry.callback !== callback;
    });

    if (filtered.length === 0) {
      this._events.delete(event);
    } else {
      this._events.set(event, filtered);
    }
  }

  emit(event, data = null) {
    if (this._events.has(event)) {
      const entries = [...this._events.get(event)];
      entries.forEach(entry => {
        try {
          entry.callback.call(entry.context, data);
        } catch (error) {
          console.error(`EventBus error in ${event}:`, error);
        }
      });
    }

    if (this._onceEvents.has(event)) {
      this._onceEvents.delete(event);
    }
  }

  clear() {
    this._events.clear();
    this._onceEvents.clear();
  }
}

export const eventBus = new EventBus();