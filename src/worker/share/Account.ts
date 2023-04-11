import {sha256} from "ethereum-cryptography/sha256";
import * as EthEcies from '../../lib/ptp/wallet/EthEcies';

import {ecdh} from "ethereum-cryptography/secp256k1";
import Mnemonic from "../../lib/ptp/wallet/Mnemonic";
import Wallet from "../../lib/ptp/wallet/Wallet";
import EcdsaHelper from "../../lib/ptp/wallet/EcdsaHelper";
import Aes256Gcm from "../../lib/ptp/wallet/Aes256Gcm";
import LocalStorage from "./db/LocalStorage";
import CloudFlareKv from "./db/CloudFlareKv";
import {Pdu} from "../../lib/ptp/protobuf/BaseMsg";
import {AuthLoginReq_Type} from "../../lib/ptp/protobuf/PTPAuth/types";
import {decrypt, encrypt} from "ethereum-cryptography/aes";
import {hashSha256} from "./utils/helpers";
import LocalDatabase from "./db/LocalDatabase";
import {randomize} from "worktop/utils";
import {EncryptType} from "../../lib/ptp/protobuf/PTPCommon/types";

const KEY_PREFIX = "a-k-";
const KEYS_PREFIX = "a-ks";
const SESSIONS_PREFIX = "a-ss";
const SESSION_PREFIX = "a-si-";

export type IMsgConn = {
  send?: (buf:Buffer|Uint8Array) => void,
  sendPduWithCallback?:  (pdu:Pdu,timeout: number) => Promise<Pdu>
}

export type ISession = {
  uid:string,
  ts:number,
  sign:Buffer,
  address:string
}

let currentAccountId: number;
let accountIds: number[] = [];
let accounts: Record<number, Account> = {};
let serverKvStore: CloudFlareKv  | undefined = undefined
let clientKvStore:LocalStorage | LocalDatabase | undefined = undefined

export default class Account {
  private accountId: number;
  private uid?: string;
  private userInfo?: object;
  private shareKey?: Buffer;
  private iv?: Buffer;
  private aad?: Buffer;
  private entropy?:string;
  private msgConn?: WebSocket | IMsgConn;
  private session?: string;
  constructor(accountId: number) {
    this.accountId = accountId;
    this.uid = "";
  }
  static getServerKv(){
    return serverKvStore!;
  }
  static getClientKv(){
    return clientKvStore!;
  }
  static setServerKv(kv:CloudFlareKv){
    serverKvStore = kv;
  }

  static setClientKv(kv:LocalStorage | LocalDatabase){
    clientKvStore = kv;
  }

  static formatSession({sign,ts,address}:{sign:Buffer,ts:number,address:string}){
    return `${sign.toString("hex")}_${ts}_${address}`
  }

  static parseSession(session:string){
    if(session){
      const [sign,time,address] = session.split("_")
      return {sign,time,address};
    }else{
      return undefined
    }
  }

  saveSession(session:string){
    const res = Account.parseSession(session)
    if(res){
      Account.getClientKv().put(`adr`,res.address)
      Account.saveSessionByAddr(res.address,session)
    }
  }

  getSession(){
    if(this.session){
      return this.session;
    }else{
      const adr = Account.getClientKv().get(`adr`);
      if(adr){
        this.session = Account.getSessionByAddr(adr);
        return this.session
      }else{
        return undefined
      }
    }
  }

  delSession(){
    this.session = undefined
    Account.getClientKv().delete(`adr`);
  }

  static saveSessionByAddr(addr:string,session:string){
    const sessions = Account.getSessions()
    sessions[addr] = session;
    Account.getClientKv().put(
      `${SESSIONS_PREFIX}`,
      JSON.stringify(sessions)
    );
  }

  static getSessionByAddr(addr:string){
    const sessions = Account.getSessions()
    if(sessions[addr]){
      return sessions[addr]
    }else{
      return undefined
    }
  }
  static getSessions(){
    const data = Account.getClientKv().get(
      `${SESSIONS_PREFIX}`,
    );
    if(data){
      return JSON.parse(data)
    }else{
      return {}
    }
  }

  async saveUidFromCacheByAddress(address: string, uid: string) {
    await Account.getServerKv().put(`ADR_UID_${address}`, uid);
  }

  async getUidFromCacheByAddress(address:string){
    const uid_cache = await Account.getServerKv().get(`ADR_UID_${address}`)
    return uid_cache || undefined;
  }
  async afterServerLoginOk({uid,address}:AuthLoginReq_Type){
    this.setUid(uid);
    const uid_cache = await Account.getServerKv().get(`ADR_UID_${address}`)
    if(!uid_cache){
      await Account.getServerKv().put(`ADR_UID_${address}`,uid)
    }
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

  getAccountId() {
    return this.accountId;
  }

  setUid(uid: string) {
    this.uid = uid;
  }

  setUserInfo(userInfo: object) {
    this.userInfo = userInfo;
  }

  getUserInfo() {
    return this.userInfo ;
  }

  getUid() {
    return this.uid;
  }

  async verifyPwd(password:string,address:string){
    const hash = hashSha256(password);
    const entropy = await this.getEntropy();
    const address1 = Account.getAddressFromEntropy(entropy,hash)
    return address === address1;
  }

  static getAddressFromEntropy(entropy:string,pasword?:string){
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy),pasword);
    const ethWallet = wallet.getPTPWallet(0);
    return ethWallet.address;
  }

  genEntropy(){
    let mnemonic = new Mnemonic();
    this.entropy = mnemonic.toEntropy();
  }

  async encryptData(plain:Buffer,password:string):Promise<Buffer>{
    const entropy = await this.getEntropy();
    if(password){
      password = hashSha256(password);
    }
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
    let { prvKey,pubKey } = wallet.getPTPWallet(EncryptType.EncryptType_Message);
    pubKey = pubKey.slice(1)
    const shareKey = Buffer.from(password!,"hex")
    // console.log("encryptData",{prvKey,pubKey,shareKey,password})
    return Aes256Gcm.encrypt(
      plain,
      shareKey,
      prvKey,
      pubKey
    );
  }
  async decryptData(cipher:Buffer,password:string):Promise<Buffer>{
    const entropy = await this.getEntropy();
    password = hashSha256(password);
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
    let { prvKey,pubKey } = wallet.getPTPWallet(EncryptType.EncryptType_Message);
    pubKey = pubKey.slice(1)
    const shareKey = Buffer.from(password!,"hex")
    // console.log("decryptData",{prvKey,pubKey,shareKey,password})
    return Aes256Gcm.decrypt(
      cipher,
      shareKey,
      prvKey,
      pubKey
    );
  }
  async encryptByPubKey(plain:Buffer,password?:string):Promise<Buffer>{
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy),password);
    let { pubKey_ } = wallet.getPTPWallet(0);
    return EthEcies.encrypt(pubKey_, plain)
  }

  async decryptByPrvKey(cipher:Buffer,password?:string ):Promise<Buffer>{
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy),password);
    let { prvKey } = wallet.getPTPWallet(0);
    return EthEcies.decrypt(prvKey, cipher)
  }

  static getAccountIdByEntropy(entropy:string){
    const keys = Account.getKeys()
    for (let i = 0; i < Object.keys(keys).length; i++) {
      const key = Object.keys(keys)[i]
      const value = keys[key]
      if(0 === value.indexOf(hashSha256(entropy))){
        const accountIdsStr =  Account.getClientKv().get("a-as");
        if(accountIdsStr){
          const accountIds = JSON.parse(accountIdsStr);
          for (let j = 0; j < accountIds.length; j++) {
            const key1 = sha256(
              Buffer.from(`${KEY_PREFIX}${accountIds[j]}`)
            ).toString('hex');
            const key2 = `${KEY_PREFIX}${key1}`
            if(key2 === key){
              return accountIds[j]
            }
          }
        }
        break
      }
    }
    return null
  }
  static saveKey(key:string,value:string){
    const keys = Account.getKeys()
    keys[key] = value;
    Account.getClientKv().put(
      `${KEYS_PREFIX}`,
      JSON.stringify(keys)
    );
  }

  static getKey(key:string){
    const keys = Account.getKeys()
    if(keys[key]){
      return keys[key].substring(64)
    }else{
      return undefined
    }
  }
  static getKeys(){
    const data = Account.getClientKv().get(
      `${KEYS_PREFIX}`,
    );
    if(data){
      return JSON.parse(data)
    }else{
      return {}
    }
  }
  async setEntropy(entropy:string,skipSave?:boolean) {
    this.entropy = entropy;
    if(!skipSave){
      const key = sha256(
        Buffer.from(`${KEY_PREFIX}${this.getAccountId()}`)
      ).toString('hex');
      let cipher = encrypt(
        Buffer.from(entropy, 'hex'),
        Buffer.from(key.substring(0, 16)),
        Buffer.from(key.substring(16, 32))
      );

      await Account.saveKey(
        `${KEY_PREFIX}${key}`,
        Buffer.concat([
          Buffer.from(hashSha256(entropy),"hex"),
          cipher
        ]).toString('hex'))
    }
  }

  async getEntropy() :Promise<string>{
    if(this.entropy){
      return this.entropy
    }
    const key = sha256(
      Buffer.from(`${KEY_PREFIX}${this.getAccountId()}`)
    ).toString('hex');

    let entropy = await Account.getKey(`${KEY_PREFIX}${key}`);
    if (!entropy) {
      let mnemonic = new Mnemonic();
      entropy = mnemonic.toEntropy();
      let cipher = encrypt(
        Buffer.from(entropy, 'hex'),
        Buffer.from(key.substring(0, 16)),
        Buffer.from(key.substring(16, 32))
      );
      console.log("====>>",Buffer.from(hashSha256(entropy),'hex').length)
      await Account.saveKey(
        `${KEY_PREFIX}${key}`,
        Buffer.concat([
          Buffer.from(hashSha256(entropy),'hex'),
          cipher
        ]).toString('hex'))
    } else {
      const plain = decrypt(
        Buffer.from(entropy, 'hex'),
        Buffer.from(key.substring(0, 16)),
        Buffer.from(key.substring(16, 32))
      );
      entropy = plain.toString('hex');
    }
    this.entropy = entropy;
    return entropy;
  }

  async initEcdh(serverPubKey: Buffer, iv: Buffer, aad: Buffer) {
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy));
    const ethWallet = wallet.getPTPWallet(0);
    this.shareKey = Buffer.from(ecdh(serverPubKey, ethWallet.prvKey));
    // console.log("shareKey",this.shareKey)
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

  async signMessage(message: string,password?: string | undefined) {
    const entropy = await this.getEntropy();
    let wallet = new Wallet(Mnemonic.fromEntropy(entropy),password);
    const ethWallet = wallet.getPTPWallet(0);
    const ecdsa = new EcdsaHelper({
      pubKey: ethWallet.pubKey,
      prvKey: ethWallet.prvKey,
    });
    return {address:ethWallet.address,sign:ecdsa.sign(message)};
  }

  verifyRecoverAddress(sig: Buffer, message: string) {
    return EcdsaHelper.recoverAddress({ message, sig });
  }

  async verifySession(session:string,password:string){
    const {address} = this.recoverAddressAndPubKey(
      Buffer.from(session!.split("_")[0],"hex"),
      session!.split("_")[1]
    )
    const res = await this.verifyPwd(password,address);
    return res ? address : "";
  }
  recoverAddressAndPubKey(sig: Buffer, message: string) {
    return EcdsaHelper.recoverAddressAndPubKey({ message, sig });
  }

  setMsgConn(msgConn:WebSocket | IMsgConn){
    this.msgConn = msgConn
  }

  sendPdu(pdu: Pdu,seq_num:number = 0){
    // return undefined
    // if(seq_num > 0){
    //   pdu.updateSeqNo(seq_num)
    // }
    // console.log("[SEND]","seq_num",pdu.getSeqNum(),"cid:",getActionCommandsName(pdu.getCommandId()))
    // this.msgConn?.send!(pdu.getPbData());
  }
  async sendPduWithCallback(pdu: Pdu){
    return undefined
    // @ts-ignore
    // return this.msgConn?.sendPduWithCallback(pdu);
  }

  static setCurrentAccount(account:Account) {
    currentAccountId = account.getAccountId();
  }

  static getCurrentAccount() {
    if (currentAccountId) {
      return Account.getInstance(currentAccountId);
    } else {
      return null;
    }
  }
  static genAccountId(){
    return +(new Date())
  }
  static getCurrentAccountId() {
    if(currentAccountId){
      return currentAccountId;
    }else{
      let accountId:number | string | null = Account.getClientKv().get("a-c-id");
      if(!accountId){
        accountId = Account.genAccountId();
      }else{
        if (typeof accountId === "string") {
          accountId = parseInt(accountId)
        }
        Account.getClientKv().put("a-c-id",String(accountId));
      }
      Account.setCurrentAccountId(accountId);
      return accountId;
    }
  }

  static setCurrentAccountId(accountId: number) {
    currentAccountId = accountId;
    const accountIdsStr =  Account.getClientKv().get("a-as");
    accountIds = accountIdsStr ? JSON.parse(accountIdsStr) : []
    if(!accountIds.includes(accountId)){
      accountIds.push(accountId);
      Account.getClientKv().put("a-as",JSON.stringify(accountIds));
    }
    Account.getClientKv().put("a-c-id",String(accountId));
  }

  static getInstance(accountId: number) {
    if (!accounts[accountId]) {
      accounts[accountId] = new Account(accountId);
    }
    return accounts[accountId];
  }

  static randomBuff(len:16|32){
    return Buffer.from(randomize(len));
  }

}
