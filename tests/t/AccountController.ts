import { diff } from 'deep-object-diff';
import { decrypt, encrypt } from 'ethereum-cryptography/aes';
import { ecdh } from 'ethereum-cryptography/secp256k1';
import { sha256 } from 'ethereum-cryptography/sha256';

import config from './config';
import type { BuddyGetALLRes_Type } from '../protobuf/PTPBuddy/types';
import type {
  GroupInfo_Type,
  GroupRecord_Type,
  MsgInfo_Type,
  UserInfo_Type,
} from '../protobuf/PTPCommon';
import {GroupInfo, UserInfo} from '../protobuf/PTPCommon';
import type {
  GroupGetListRes_Type,
  GroupUnreadMsgRes_Type,
} from '../protobuf/PTPGroup/types';
import DateHelper from './DateHelper';
import DbStorage from './DbStorage';
import GroupController from './GroupController';
import UserController from './UserController';
import Aes256Gcm from './wallet/Aes256Gcm';
import EcdsaHelper from './wallet/EcdsaHelper';
import Mnemonic from './wallet/Mnemonic';
import Wallet from './wallet/Wallet';

export interface GroupRecord {
  groupAddress: string;
  lastMsgId: number;
  unReadCnt: number;
  msgUpdateTime: number;
}

export interface AccountSession {
  address: string;
  note?: string;
  uid?: number;
}

let currentAccountId: number;
let accountIds: number[] = [];
let accounts: Record<number, AccountController> = {};

export default class AccountController {
  private accountId: number;
  private uid?: number;
  private shareKey?: Buffer;
  private iv?: Buffer;
  private aad?: Buffer;
  private userInfo?: UserInfo_Type;
  private accountSession?: AccountSession;
  private address: string | undefined;
  public groupInfoUpdatedTime: number;
  public buddyUpdatedTime: number;
  private selectedGroupId: number;
  private groupRecords: Record<number, GroupRecord>;
  private groupMsgUpdated: Array<number>[];
  constructor(accountId: number) {
    this.accountId = accountId;
    this.groupInfoUpdatedTime = 0;
    this.buddyUpdatedTime = 0;
    this.address = undefined;
    this.uid = 0;
    this.groupRecords = {};
    this.selectedGroupId = 0;
    this.groupMsgUpdated = [];
  }
  getShareKey() {
    return this.shareKey!;
  }
  getIv() {
    return this.iv!;
  }
  getAad() {
    return this.aad!;
  }
  getGroupInfoUpdatedTime() {
    return this.groupInfoUpdatedTime;
  }
  getBuddyUpdatedTime() {
    return this.buddyUpdatedTime;
  }
  async init(accountSession: AccountSession) {
    this.setAccountSession(accountSession);
    this.address = accountSession.address;
    if (accountSession.uid) {
      this.uid = accountSession.uid;
    }

    let userInfo: UserInfo_Type | undefined = this.getUserInfo();

    if (accountSession.uid && !userInfo) {
      const user = UserController.getInstance(accountSession.uid);
      user.setAddress(accountSession.address);
      userInfo = await user.getUserInfoFromDb(accountSession.address);
    }

    if (!userInfo) {
      userInfo = new UserInfo({
        address: accountSession.address,
        avatar: '',
        nick_name: '',
        pub_key: Buffer.alloc(0),
        sign_info: '',
        status: 0,
        uid: 0,
        user_name: '',
      }).getMsg();
      if (accountSession.uid) {
        UserController.getInstance(accountSession.uid).setUserInfo(userInfo);
      }
    }
    this.setUserInfo(userInfo);
    return userInfo!;
  }
  setAccountSession(accountSession: AccountSession) {
    this.accountSession = accountSession;
  }
  getAccountSession() {
    return this.accountSession!;
  }
  getAccountId() {
    return this.accountId;
  }
  getUserInfo() {
    if (this.userInfo?.uid) {
      return UserController.getInstance(this.userInfo?.uid).getUserInfo();
    } else {
      return this.userInfo!;
    }
  }
  setUserInfo(userInfo: UserInfo_Type) {
    this.userInfo = userInfo;
    if (userInfo.uid) {
      const user = UserController.getInstance(userInfo.uid);
      if (!user.getUserInfo() || diff(user.getUserInfo(), userInfo)) {
        user.setUserInfo(userInfo);
        user.saveUserInfoToDb();
      }
    }
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
  async getAccountAddress() {
    const address = this.getAddress();
    if (!address) {
      const entropy = await this.getEntropy();
      let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
      const ethWallet = wallet.getPTPWallet(0);
      this.address = ethWallet.address;
      return this.address;
    } else {
      return address;
    }
  }
  async removeAccount() {
    const key = sha256(
      Buffer.from(`${config.dbPrefix.Key}${this.getAccountId()}`)
    ).toString('hex');
    await DbStorage.removeItem(`${config.dbPrefix.Key}${key}`);
    delete accounts[this.accountId];
  }
  async getEntropy() {
    const key = sha256(
      Buffer.from(`${config.dbPrefix.Key}${this.getAccountId()}`)
    ).toString('hex');
    let entropy = await DbStorage.getItem(`${config.dbPrefix.Key}${key}`);
    if (!entropy) {
      let mnemonic = new Mnemonic();
      entropy = mnemonic.toEntropy();
      let cipher = encrypt(
        Buffer.from(entropy, 'hex'),
        Buffer.from(key.substring(0, 16)),
        Buffer.from(key.substring(16, 32))
      );
      await DbStorage.setItem(
        `${config.dbPrefix.Key}${key}`,
        cipher.toString('hex')
      );
    } else {
      const plain = decrypt(
        Buffer.from(entropy, 'hex'),
        Buffer.from(key.substring(0, 16)),
        Buffer.from(key.substring(16, 32))
      );
      entropy = plain.toString('hex');
    }
    return entropy;
  }

  async signGroupMessage(message: string, group_idx: number) {
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
    const groupWallet = wallet.getGroupWallet(group_idx);
    const ecdsa = new EcdsaHelper({
      pubKey: groupWallet.pubKey,
      prvKey: groupWallet.prvKey,
    });
    return { sign: ecdsa.sign(message), address: groupWallet.address };
  }
  async initEcdh(serverPubKey: Buffer, iv: Buffer, aad: Buffer) {
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
    const ethWallet = wallet.getPTPWallet(0);
    this.shareKey = Buffer.from(ecdh(serverPubKey, ethWallet.prvKey));
    this.aad = aad;
    this.iv = iv;
  }
  aesEncrypt(plainData: Buffer) {
    return Aes256Gcm.encrypt(
      plainData,
      this.getShareKey(),
      this.getIv(),
      this.getAad()
    );
  }
  aesDecrypt(cipherData: Buffer) {
    return Aes256Gcm.decrypt(
      cipherData,
      this.getShareKey(),
      this.getIv(),
      this.getAad()
    );
  }
  async signMessage(message: string) {
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
    const ethWallet = wallet.getPTPWallet(0);
    this.address = ethWallet.address;
    const ecdsa = new EcdsaHelper({
      pubKey: ethWallet.pubKey,
      prvKey: ethWallet.prvKey,
    });
    return ecdsa.sign(message);
  }

  verifyRecoverAddress(sig: Buffer, message: string) {
    return EcdsaHelper.recoverAddress({ message, sig });
  }

  recoverAddressAndPubKey(sig: Buffer, message: string) {
    return EcdsaHelper.recoverAddressAndPubKey({ message, sig });
  }

  async addEntropy(entropy: string) {
    const key = sha256(
      Buffer.from(`${config.dbPrefix.Key}${this.getAccountId()}`)
    ).toString('hex');
    let cipher = encrypt(
      Buffer.from(entropy, 'hex'),
      Buffer.from(key.substring(0, 16)),
      Buffer.from(key.substring(16, 32))
    );
    await DbStorage.setItem(
      `${config.dbPrefix.Key}` + key,
      cipher.toString('hex')
    );
  }
  setGroupRecord(group_id: number, groupRecord: GroupRecord) {
    this.groupRecords[group_id] = groupRecord;
    this.__saveGroupRecordToDb(group_id,this.groupRecords[group_id]);
  }

  getGroupRecord(group_id: number) {
    return this.groupRecords[group_id];
  }

  setSelectedGroupId(group_id: number) {
    this.selectedGroupId = group_id;
    DbStorage.setItem(
      `${config.dbPrefix.GroupSelectedId}.` + this.uid,
      String(group_id)
    );
  }

  getSelectedGroupId() {
    return this.selectedGroupId;
  }

  async initGroups() {
    if (!this.selectedGroupId) {
      const selectedGroupIdStr = await DbStorage.getItem(
        `${config.dbPrefix.GroupSelectedId}.` + this.uid
      );
      if (selectedGroupIdStr) {
        this.selectedGroupId = Number(selectedGroupIdStr);
      }
    }
    if (this.buddyUpdatedTime === 0) {
      const buddy_updated_timeStr = await DbStorage.getItem(
        `${config.dbPrefix.BuddyUpdatedTime}.` + this.uid
      );
      if (buddy_updated_timeStr) {
        this.buddyUpdatedTime = Number(buddy_updated_timeStr);
      }
    }

    if (this.groupInfoUpdatedTime === 0) {
      const groupInfoUpdatedTimeStr = await DbStorage.getItem(
        `${config.dbPrefix.GroupInfoUpdatedTime}.${this.getUid()}`
      );
      if (groupInfoUpdatedTimeStr) {
        this.groupInfoUpdatedTime = Number(groupInfoUpdatedTimeStr);
      }
    }
    let unReadCnt = 0;
    if (Object.keys(this.groupRecords).length === 0) {
        await this.getGroupRecordFromDb();
    } else {
      return [];
    }
  }
  async getGroupRecordFromDb(){
    const res = await DbStorage.query(
      `async_db_${config.dbPrefix.GroupRecord}.${this.getUid()}.`)
    const {rows} = res
    for (let i = 0; i < rows.length; i++) {
      const {doc} = rows[i]
      const group_id = parseInt(doc._id.replace(`async_db_${config.dbPrefix.GroupRecord}.${this.getUid()}.`,""))
      this.groupRecords[group_id] = {
        groupAddress:doc.groupAddress,
        lastMsgId:doc.lastMsgId,
        unReadCnt:doc.unReadCnt,
        msgUpdateTime:doc.msgUpdateTime
      }
      let groupInfo = GroupController.getInstance(group_id).getGroupInfo();
      if(!groupInfo){
        await GroupController.getInstance(group_id).getGroupInfoFromDb();
      }
    }
  }
  getOrderedGroupIds(){
    let rows = []
    const groupIds = Object.keys(this.groupRecords)
    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i];
      rows.push([parseInt(groupId),this.groupRecords[parseInt(groupId)].msgUpdateTime])
    }
    return rows.sort((a:number[],b:number[])=>(b[1] - a[1])).map(row=>row[0]);
  }
  saveGroupRecordAfterReadMsg(group_id: number) {
    this.groupRecords[group_id] = {
      ...this.groupRecords[group_id],
      unReadCnt: 0,
    };
    this.__saveGroupRecordToDb(group_id,this.groupRecords[group_id]);
  }
  private __saveGroupRecordToDb(group_id:number,groupRecord:GroupRecord) {
    DbStorage.setItem(
      `${config.dbPrefix.GroupRecord}.${this.getUid()}.${group_id}`,
      groupRecord,true
    ).catch(console.error)
  }
  saveGroupMsg(
    group_id: number,
    msgInfo: MsgInfo_Type,
    needIncrUnReadCnt: boolean = false
  ) {
    let notify = {};
    if (needIncrUnReadCnt) {
      notify = {
        unReadCnt: this.groupRecords[group_id].unReadCnt + 1,
      };
    }
    this.groupRecords[group_id] = {
      ...this.groupRecords[group_id],
      lastMsgId: msgInfo.msg_id || 0,
      msgUpdateTime: msgInfo.sent_at,
      ...notify,
    };
    GroupController.getInstance(msgInfo.group_id).saveMsg([msgInfo]);
    this.__saveGroupRecordToDb(group_id,this.getGroupRecord(group_id));
  }
  GroupGetListRes(GroupGetListRes: GroupGetListRes_Type) {
    const { groups, group_info_updated_time } = GroupGetListRes;
    this.groupInfoUpdatedTime = group_info_updated_time;
    if(groups){
      this.saveGroups(groups);
    }

    DbStorage.setItem(
      `${config.dbPrefix.GroupInfoUpdatedTime}.${this.getUid()}`,
      String(this.groupInfoUpdatedTime)
    ).catch(console.error);
    return this.groupMsgUpdated;
  }

  GroupUnreadMsgRes(GroupUnreadMsgRes: GroupUnreadMsgRes_Type) {
    const { unread_list } = GroupUnreadMsgRes;
    if (unread_list && unread_list.length > 0) {
      unread_list.forEach((msgInfo: MsgInfo_Type) => {
        const { group_id } = msgInfo;
        if (this.groupRecords[group_id]) {
          this.groupRecords[group_id].unReadCnt = msgInfo.msg_id - this.groupRecords[group_id].lastMsgId;
          this.groupRecords[group_id].lastMsgId = msgInfo.msg_id
          this.groupRecords[group_id].msgUpdateTime = msgInfo.sent_at
        }
        this.__saveGroupRecordToDb(group_id,this.groupRecords[group_id]);
      });
    }
  }
  BuddyGetALLRes(BuddyGetALLRes: BuddyGetALLRes_Type) {
    const { buddy_list, buddy_updated_time } = BuddyGetALLRes;
    this.buddyUpdatedTime = buddy_updated_time;
    if (buddy_list && buddy_list.length > 0) {
      for (let i = 0; i < buddy_list.length; i++) {
        const userInfo = buddy_list[i];
        const user = UserController.getInstance(userInfo.uid);
        if (!user.getUserInfo() || diff(user.getUserInfo(), userInfo)) {
          user.setUserInfo(userInfo);
          user.saveUserInfoToDb().catch(console.error);
        }
      }
    }
    DbStorage.setItem(
      `${config.dbPrefix.BuddyUpdatedTime}.` + this.uid,
      String(buddy_updated_time)
    ).catch(console.error);
  }
  static getInstance(accountId: number) {
    if (!accounts[accountId]) {
      accounts[accountId] = new AccountController(accountId);
    }
    return accounts[accountId];
  }

  saveGroups(groups:GroupInfo_Type[]){
    if (groups.length > 0) {
      for (let i = 0; i < groups?.length; i++) {
        const groupInfo = groups[i];
        const group = GroupController.getInstance(groupInfo.group_id);
        group.saveGroupInfoToDb(groupInfo).catch(console.error);
        const {group_id,group_adr} = groupInfo;
        if (!this.groupRecords[group_id]) {
          this.groupRecords[group_id] = {
            groupAddress:group_adr,
            unReadCnt:0,
            lastMsgId:0,
            msgUpdateTime:(Math.ceil(+(new Date()) / 1000))
          };
          this.__saveGroupRecordToDb(group_id,this.groupRecords[group_id]);
        }
      }
    }
  }
  static getCurrentAccount() {
    if (currentAccountId) {
      return AccountController.getInstance(currentAccountId);
    } else {
      return null;
    }
  }

  static getCurrentAccountId() {
    if(currentAccountId){
      return currentAccountId;
    }else{
      let accountId:number | string | null = sessionStorage.getItem("CurrentAccountId");
      if(!accountId){
        accountId = DateHelper.currentTimestamp1000();
      }else{
        accountId = parseInt(accountId)
        sessionStorage.setItem("CurrentAccountId",String(accountId));
      }
      AccountController.setCurrentAccountId(accountId);
      return accountId;
    }
  }

  static setCurrentAccountId(accountId: number) {
    if(!accountIds.includes(accountId)){
      accountIds.push(accountId);
      localStorage.setItem("AccountIds",JSON.stringify(accountIds));
    }
    sessionStorage.setItem("CurrentAccountId",String(accountId));
    currentAccountId = accountId;
  }

  static saveAccountIds() {
    const accountIdsStr = localStorage.getItem("AccountIds");
    if(accountIdsStr){
      JSON.parse(accountIdsStr).forEach((id:number)=>{
        if(!accountIds.includes(id)){
          accountIds.push(id);
        }
      })
    }
    localStorage.setItem("AccountIds",JSON.stringify(accountIds));
    sessionStorage.setItem("CurrentAccountId",String(AccountController.getCurrentAccountId()));
  }
  static async addAccount() {
    const accountId = DateHelper.currentTimestamp1000();
    const account = AccountController.getInstance(
      accountId
    );
    AccountController.setCurrentAccountId(accountId);
    await account.saveConfig();
    AccountController.saveAccountIds();
  }
  static async initAccounts() {
    if(accountIds.length == 0){
      let accountsStr = localStorage.getItem("AccountIds");
      if(accountsStr){
        accountIds = JSON.parse(accountsStr);
        accountIds.sort((a,b)=>{
          return b-a;
        })
      }
    }
    const accountId = AccountController.getCurrentAccountId();
    const account = AccountController.getInstance(
      accountId
    );
    await account.loadConfig();
    await account.getAccountAddress();
  }

  async loadConfig(){
    const accountStr = await DbStorage.getItem("Account_"+this.accountId);
    if(accountStr){
      let {uid,address} = JSON.parse(accountStr);
      this.uid = uid;
      this.address = address;
    }else{
      this.uid = 0;
      this.address = await this.getAccountAddress();
      await this.saveConfig();
      AccountController.saveAccountIds();
    }
  }

  async saveConfig(){
    await DbStorage.setItem("Account_"+this.accountId,JSON.stringify({
      uid:this.uid ? this.uid : 0,
      address:this.address,
    }));
  }
}
