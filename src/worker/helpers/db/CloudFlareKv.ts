export default class CloudFlareKv{
  private db: any;
  init(db:any){
    this.db = db;
  }
  async put(key:string,value:any){
    return this.db.put(key,value)
  }

  async get(key:string){
    return this.db.get(key)
  }

  async delete(key:string){
    return this.db.delete(key)
  }

  async list(options:{prefix?:string}){
    const rows = [];
    let cur = null;
    do {
      const {keys, cursor} = await this.db.list({
        prefix: options.prefix,
        cursor: cur,
      });
      rows.push(...keys);
      cur = cursor;
    } while (cur);

    return rows;
  }

}
