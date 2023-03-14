const fs = require('fs').promises;

export default class LocalFile{
  private saveDir: string | undefined;
  private dbName: string | undefined;
  async init(dbName:string,saveDir:string){
    this.dbName = dbName;
    this.saveDir = saveDir;
    if(!saveDir){
      throw new Error("LocalFile saveDir is null")
    }
    this.saveDir = saveDir;

    try{
      await fs.mkdir(`${this.saveDir}/${this.dbName}`,{recursive:true});
      console.log("kv adapter is: LocalFile, dir :",`${this.saveDir}/${this.dbName}`)

    }catch (e){
      throw new Error(`${this.saveDir}/${this.dbName} is not writable`)
    }
  }
  async put(key:string,value:any){
    await fs.writeFile(`${this.saveDir}/${this.dbName}/${key}.json`,JSON.stringify({
      value
    }))
  }

  async get(key:string){
    const res =  await fs.readFile(`${this.saveDir}/${this.dbName}/${key}.json`)
    if(res){
      const {value} = JSON.parse(res);
      return value;
    }else{
      return null;
    }
  }

  async delete(key:string){
    await fs.rm(`${this.saveDir}/${this.dbName}/${key}.json`)
  }

  async list({prefix}:{prefix?:string}){
    const files = await fs.readdir(`${this.saveDir}/${this.dbName}`,{withFileTypes:true})
    const keys: string[] = [];
    files.forEach((file:any)=>{
      if(file.name.endsWith(".json")){
        if(prefix){
          if(file.name.indexOf(prefix) === 0){
            keys.push(file.name.replace(".json",""))
          }
        }else{
          keys.push(file.name.replace(".json",""))
        }
      }
    })
    return keys;
  }
}
