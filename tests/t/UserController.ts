import type { UserInfo_Type } from '../protobuf/PTPCommon';
import { UserInfo } from '../protobuf/PTPCommon';
import DbStorage from './DbStorage';
import {getUserLocalKey} from "./config";

let users: Record<number, UserController> = {};

export default class UserController {
  private address?: string;
  private uid: number;
  private userInfo?: UserInfo_Type;
  constructor(uid: number) {
    this.uid = uid;
    this.address = undefined;
  }

  getUserInfo() {
    return this.userInfo!;
  }
  setUserInfo(userInfo: UserInfo_Type) {
    this.userInfo = userInfo;
    this.setUid(userInfo.uid);
    this.setAddress(userInfo.address);
  }
  getAddress() {
    return this.address;
  }
  setAddress(address: string) {
    this.address = address;
  }
  setUid(uid: number) {
    this.uid = uid;
  }
  getUid() {
    return this.uid;
  }

  async getUserInfoFromServer() {}
  async getUserInfoFromDb(address?: string) {
    let userInfo: UserInfo_Type | undefined = undefined;
    const userInfoHex = await DbStorage.getItem(
      getUserLocalKey({
        uid: this.uid,
      })
    );
    if (userInfoHex) {
      userInfo = new UserInfo().fromHex(userInfoHex);
      this.setUserInfo(userInfo!);
      if (userInfo?.address) {
        this.setAddress(userInfo.address);
      }
    }
    if (address) {
      this.setAddress(address);
    }
    if (!userInfo) {
      userInfo = new UserInfo({
        address: address || '',
        avatar: '',
        nick_name: '',
        pub_key: Buffer.alloc(0),
        sign_info: '',
        status: 0,
        uid: this.uid,
        user_name: '',
      }).getMsg();
    }
    return userInfo;
  }
  async saveUserInfoToDb() {
    const userInfoHex = new UserInfo(this.getUserInfo()).toHex();
    await DbStorage.setItem(
      getUserLocalKey({
        uid: this.uid,
      }),
      userInfoHex
    );
  }
  static getInstance(uid: number) {
    if (!users[uid]) {
      users[uid] = new UserController(uid);
    }
    return users[uid];
  }
}
