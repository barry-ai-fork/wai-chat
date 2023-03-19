export default class CloudFlareKv{
  private db: any;
  private cache:Record<string, any> = {};
  init(db:any){
    this.db = db;
  }
  async put(key:string,value:any){
    console.log("[kv put]",key,value)
    this.cache[key] = value;
    return this.db.put(key,value)
  }

  async get(key:string){
    if(this.cache[key]!== undefined){
      console.log("from cache",key)
      return this.cache[key]
    }else{
      const res = await this.db.get(key)
      this.cache[key] = res;
      return this.cache[key]
    }
  }

  async delete(key:string){
    console.log("[delete]",key)
    delete this.cache[key];
    return this.db.delete(key)
  }

  async list(options:{prefix?:string}){
    const rows = [];
    let cur = null;
    do {
      // @ts-ignore
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
