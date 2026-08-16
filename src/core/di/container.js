export class Container {
  constructor() {
    this.dependencies = new Map();
  }

  register(name, instance) {
    this.dependencies.set(name, instance);
  }

  get(name) {
    return this.dependencies.get(name);
  }
}
