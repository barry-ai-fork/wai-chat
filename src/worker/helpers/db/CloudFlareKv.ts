export default class CloudFlareKv{
  private db: any;
  async init(db:any){
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
    return this.db.delete(options)
  }
}
