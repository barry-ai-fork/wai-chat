let DbStorage: {
  getItem(key: string, ...args: Array<any>): any;
  setItem(key: string, value: any, ...args: Array<any>): any;
  removeItem(key: string, ...args: Array<any>): any;
};
let __db: any = null;

export class DbStorageLocal {
  static async getItem(key: string) {
    return window.localStorage.getItem(`async_db_${key}`);
  }

  static async setItem(key: string, value: string) {
    window.localStorage.setItem(`async_db_${key}`, String(value));
  }

  static async removeItem(key: string) {
    window.localStorage.removeItem(`async_db_${key}`);
  }
}
export class DbStoragePb {
  static getPdb(){
    if(!__db){
      //@ts-ignore
      __db = new window.PouchDB('AsyncStorage');
    }
    return __db;
  }
  static async query(startkey:string){
    const endkey = startkey+'\ufff0'
    return await DbStoragePb.getPdb().allDocs({
      include_docs: true,
      attachments: false,
      startkey,
      endkey
    });
  }
  static async getItem(key: string,valueIsObj: boolean = false) {
    try {
      const doc = await DbStoragePb.getPdb().get(`async_db_${key}`);
      if(valueIsObj){
        return doc;
      }else{
        return doc.value;
      }
    } catch (e) {
      return null;
    }
  }

  static async setItem(key: string, value: any, valueIsObj: boolean = false) {
    try {
      const doc = await DbStoragePb.getPdb().get(`async_db_${key}`);
      if(valueIsObj){
        await DbStoragePb.getPdb().put({
          _id: doc._id,
          _rev: doc._rev,
          ...value,
        });
      }else{
        await DbStoragePb.getPdb().put({
          _id: doc._id,
          _rev: doc._rev,
          value,
        });
      }

    } catch (e) {
      // @ts-ignore
      if (e.status == 404) {
        try {
          if(valueIsObj){
            await DbStoragePb.getPdb().put({
              _id: `async_db_${key}`,
              ...value,
            });
          }else{
            await DbStoragePb.getPdb().put({
              _id: `async_db_${key}`,
              value,
            });
          }

        } catch (e) {
          console.error('setItem error', key, e);
        }
      }
    }
  }

  static async removeItem(key: string) {
    try {
      const doc = await DbStoragePb.getPdb().get(`async_db_${key}`);
      await DbStoragePb.getPdb().remove(doc);
    } catch (e) {
      console.error(e);
    }
  }
}

DbStorage = DbStoragePb;

// @ts-ignore
export default DbStoragePb;
