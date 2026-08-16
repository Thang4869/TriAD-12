/**
 * @interface IRepository
 * @template T
 */
export class IRepository {
  findAll() {
    throw new Error("Not implemented");
  }
  findById(id) {
    throw new Error("Not implemented");
  }
  save(items) {
    throw new Error("Not implemented");
  }
  clear() {
    throw new Error("Not implemented");
  }
}
