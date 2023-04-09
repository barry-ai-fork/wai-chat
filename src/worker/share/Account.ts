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
import {getActionCommandsName} from "../../lib/ptp/protobuf/ActionCommands";
import {decrypt, encrypt} from "ethereum-cryptography/aes";
import {hashSha256} from "./utils/helpers";
import LocalDatabase from "./db/LocalDatabase";
import {UseLocalDb} from "../setting";
import {randomize} from "worktop/utils";
import {EncryptType} from "../../lib/ptp/protobuf/PTPCommon/types";

const KEY_PREFIX = "a-k-";
const KEYS_PREFIX = "a-ks";
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
let kvStore:LocalStorage | CloudFlareKv | LocalDatabase | undefined = undefined

export default class Account {
  private accountId: number;
  private uid?: string;
  private userInfo?: object;
  private shareKey?: Buffer;
  private iv?: Buffer;
  private aad?: Buffer;
  private entropy?:string;
  private address: string | undefined;
  private session: ISession | undefined;
  private msgConn?: WebSocket | IMsgConn;
  constructor(accountId: number) {
    this.accountId = accountId;
    this.address = undefined;
    this.uid = "";
    this.session = undefined;
  }
  static getKv(){
    return kvStore!;
  }
  static setKvStore(kv:LocalStorage | CloudFlareKv | LocalDatabase){
    kvStore = kv;
  }

  setSession(session?:ISession){
    this.session = session
  }

  getSession(){
    return this.session
  }

  async saveSession(){
    await Account.getKv().put(`${SESSION_PREFIX}${this.accountId}`,JSON.stringify({
      ...this.session,
      sign:Buffer.from(this.session!.sign).toString('hex')
    }))
  }

  async delSession(){
    this.setSession(undefined);
    // await Account.getKv().delete(`${SESSION_PREFIX}${this.accountId}`)
  }

  async loadSession(){
    const res = await Account.getKv().get(`${SESSION_PREFIX}${this.accountId}`);
    if(res){
      const data = JSON.parse(res);
      this.setSession({
        ...data,
        sign:Buffer.from(data.sign,"hex")
      })
      return this.getSession();
    } else {
      return null;
    }
  }

  async getUidFromCacheByAddress(address:string){
    const uid_cache = await Account.getKv().get(`ADR_UID_${address}`)
    return uid_cache || undefined;
  }
  async afterServerLoginOk({uid,sign,ts,address}:AuthLoginReq_Type){
    this.setUid(uid);
    this.setSession({uid,sign,ts,address});
    const uid_cache = await Account.getKv().get(`ADR_UID_${address}`)
    if(!uid_cache){
      await Account.getKv().put(`ADR_UID_${address}`,uid)
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
  getAddress() {
    return this.address;
  }
  setAddress(address: string) {
    this.address = address;
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
  async getAccountAddress() {
    const address = this.getAddress();
    if (!address) {
      const entropy = await this.getEntropy();
      this.address = Account.getAddressFromEntropy(entropy);
      return this.address!;
    } else {
      return address;
    }
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

  async saveKey(key:string,value:string){
    const keys = await this.getKeys()
    keys[key] = value;
    await Account.getKv().put(
      `${KEYS_PREFIX}`,
      JSON.stringify(keys)
    );
  }
  async getKey(key:string){
    const keys = await this.getKeys()
    return keys[key] ? keys[key] : undefined
  }
  async getKeys(){
    const data = await Account.getKv().get(
      `${KEYS_PREFIX}`,
    );
    if(data){
      return JSON.parse(data)
    }else{
      return {}
    }
  }
  async setEntropy(entropy:string) {
    this.entropy = entropy;
    const key = sha256(
      Buffer.from(`${KEY_PREFIX}${this.getAccountId()}`)
    ).toString('hex');
    let cipher = encrypt(
      Buffer.from(entropy, 'hex'),
      Buffer.from(key.substring(0, 16)),
      Buffer.from(key.substring(16, 32))
    );
    await this.saveKey(`${KEY_PREFIX}${key}`,cipher.toString('hex'))
  }

  async getEntropy() {
    if(this.entropy){
      return this.entropy
    }
    const key = sha256(
      Buffer.from(`${KEY_PREFIX}${this.getAccountId()}`)
    ).toString('hex');

    let entropy = await this.getKey(`${KEY_PREFIX}${key}`);
    if (!entropy) {
      let mnemonic = new Mnemonic();
      entropy = mnemonic.toEntropy();
      let cipher = encrypt(
        Buffer.from(entropy, 'hex'),
        Buffer.from(key.substring(0, 16)),
        Buffer.from(key.substring(16, 32))
      );
      await this.saveKey(`${KEY_PREFIX}${key}`,cipher.toString('hex'))
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

  async addEntropy(entropy: string) {
    const key = sha256(
      Buffer.from(`${KEY_PREFIX}${this.getAccountId()}`)
    ).toString('hex');
    let cipher = encrypt(
      Buffer.from(entropy, 'hex'),
      Buffer.from(key.substring(0, 16)),
      Buffer.from(key.substring(16, 32))
    );
    await this.saveKey(`${KEY_PREFIX}${key}`,cipher.toString('hex'))
  }

  setMsgConn(msgConn:WebSocket | IMsgConn){
    this.msgConn = msgConn
  }

  sendPdu(pdu: Pdu,seq_num:number = 0){
    if(UseLocalDb){
      return undefined
    }
    if(seq_num > 0){
      pdu.updateSeqNo(seq_num)
    }
    console.log("[SEND]","seq_num",pdu.getSeqNum(),"cid:",getActionCommandsName(pdu.getCommandId()))
    this.msgConn?.send!(pdu.getPbData());
  }
  async sendPduWithCallback(pdu: Pdu){
    if(UseLocalDb){
      return undefined
    }
    // @ts-ignore
    return this.msgConn?.sendPduWithCallback(pdu);
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
      let accountId:number | string | null = localStorage.getItem("a-c-id");
      if(!accountId){
        accountId = Account.genAccountId();
      }else{
        accountId = parseInt(accountId)
        Account.getKv().put("a-c-id",String(accountId));
      }
      Account.setCurrentAccountId(accountId);
      return accountId;
    }
  }

  static setCurrentAccountId(accountId: number) {
    const accountIdsStr =  localStorage.getItem("a-as");
    accountIds = accountIdsStr ? JSON.parse(accountIdsStr) : []
    if(!accountIds.includes(accountId)){
      accountIds.push(accountId);
      Account.getKv().put("a-as",JSON.stringify(accountIds));
    }
    Account.getKv().put("a-c-id",String(accountId));
    currentAccountId = accountId;
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
