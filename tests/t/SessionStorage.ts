export default class SessionStorage {
  static async getItem(key: string) {
    return window.sessionStorage.getItem(key);
  }

  static async setItem(key: string, value: string) {
    window.sessionStorage.setItem(key, value + '');
  }

  static async removeItem(key: string) {
    window.sessionStorage.removeItem(key);
  }
  static async clear() {}
}
