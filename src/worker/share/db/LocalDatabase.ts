import {LocalDb} from "../../../api/gramjs/localDb";

export default class LocalDatabase {
  private db: LocalDb | undefined;
  constructor() {

  }
  init(db:LocalDb) {
    this.db = db;
  }

  async put(key: string, value: any) {
    this.db!.cache[key] = value;
  }

  async get(key: string) {
    return this.db!.cache[key]
  }

  async delete(key: string) {
    delete this.db!.cache[key];
  }
}
