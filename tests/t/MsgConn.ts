import { diff } from 'deep-object-diff';
import ua_parser from 'ua-parser-js';

import config from './config';
import { Pdu } from '../protobuf/Pdu';
import {ActionCommands, getActionCommandsName} from '../protobuf/ActionCommands';
import {
  AuthCaptchaReq,
  AuthCaptchaRes,
  AuthLoginReq,
  AuthLoginRes,
} from '../protobuf/PTPAuth';

import { BuddyGetALLReq, BuddyGetALLRes } from '../protobuf/PTPBuddy';
import type * as PTPCommon from '../protobuf/PTPCommon';
import {
  ClientType,
  ERR,
  GroupType,
  UserInfo_Type,
} from '../protobuf/PTPCommon';
import {
  GroupCreateReq,
  GroupCreateRes,
  GroupGetListReq,
  GroupGetListRes,
  GroupUnreadMsgReq,
  GroupUnreadMsgRes,
} from '../protobuf/PTPGroup';
import GroupPreCreateReq from '../protobuf/PTPGroup/GroupPreCreateReq';
import GroupPreCreateRes from '../protobuf/PTPGroup/GroupPreCreateRes';
import { HeartBeatNotify } from '../protobuf/PTPOther';
import { SwitchDevicesReq } from '../protobuf/PTPSwitch';
import AccountController from './AccountController';
import DateHelper from './DateHelper';
import { MsgHandler } from '../protobuf/MsgHandler';
import {FileImgUploadReq} from "../protobuf/PTPFile";


export enum MsgConnNotifyAction{
  onInitAccount,
  onConnectionStateChanged,
  onLoginOk,
  onInitGroupOk
}

export type MsgConnNotify = {
  action: MsgConnNotifyAction;
  payload: any;
};

export enum MsgClientState {
  connect_none,
  closed,
  connect_error,
  connecting,
  connected,
  logged,
}

let reconnect_cnt = 0;
let clients: Record<number, MsgConn> = {};

export function getClientType(): ClientType {
  return ClientType.CLIENT_TYPE_WEB;
}

export async function getClientId() {
  let client_id = null;
  client_id = window.sessionStorage.getItem('client_id');
  if (!client_id) {
    client_id = String(DateHelper.currentTimestamp1000());
    window.sessionStorage.setItem('client_id', client_id);
  }
  return client_id;
}

export async function getClientInfo() {
  let client_id = await getClientId();
  const { browser, os } = ua_parser(navigator.userAgent);
  return {
    client_id,
    os_name: os.name!,
    os_version: os.version!,
    browser_name: browser.name!,
    browser_version: browser.version!,
    is_intel: navigator.userAgent.toLowerCase().indexOf('intel') >= 0,
  };
}

export const handleError = (error: ERR) => {
  let error_msg = null;
  switch (error) {
    case ERR.E_USERNAME_EXISTS:
      error_msg = config.errMsg['E_USERNAME_EXISTS'];
      break;
    case ERR.E_REASON_NO_DB_SERVER:
      error_msg = config.errMsg['E_REASON_NO_DB_SERVER'];
      break;
    default:
      error_msg = ERR[error];
      break;
  }
  return error_msg;
};

let currentMsgConn: MsgConn | null = null;

export default class MsgConn {
  private accountId: number;
  private serverPubKey?: Buffer;
  private autoConnect: boolean;
  public state: MsgClientState;
  public client: WebSocket | any | undefined;
  private __rev_msg_map: Record<number, Pdu>;
  private __sending_msg_map: Record<number, boolean>;
  private __sending_msg_list: Pdu[];
  private __msgHandler: any;
  private sendMsgTimer?: NodeJS.Timeout;
  constructor(accountId: number) {
    this.accountId = accountId;
    this.autoConnect = true;
    this.sendMsgTimer = undefined;
    this.state = MsgClientState.connect_none;
    this.__msgHandler = null;
    this.__rev_msg_map = {};
    this.__sending_msg_map = {};
    this.__sending_msg_list = [];
  }

  getServerPubKey() {
    return this.serverPubKey;
  }
  getState() {
    return this.state;
  }
  getAccountId() {
    return this.accountId;
  }

  getAutoConnect() {
    return this.autoConnect;
  }
  setAutoConnect(autoConnect: boolean) {
    this.autoConnect = autoConnect;
  }
  async close() {
    if (this.client && this.isConnect()) {
      this.client.close();
    }
  }
  connect() {
    if (
      this.state === MsgClientState.logged ||
      this.state === MsgClientState.connecting ||
      this.state === MsgClientState.connected ||
      this.accountId !== AccountController.getCurrentAccountId()
    ) {
      return;
    }
    try {
      if (
        currentMsgConn?.isConnect() &&
        currentMsgConn?.getAccountId() !== this.accountId
      ) {
        currentMsgConn.setAutoConnect(false);
        currentMsgConn.close();
      }
      this.notifyState(MsgClientState.connecting);
      console.log(
        'connecting...',
        AccountController.getInstance(this.accountId).getAddress(),
        this.autoConnect
      );
      this.client = new WebSocket(config.msgServer.wsUrl);
      this.client.binaryType = 'arraybuffer';
      this.client.onopen = this.onConnected.bind(this);
      this.client.onmessage = this.onData.bind(this);
      this.client.onclose = this.onClose.bind(this);
    } catch (e) {
      console.error('connect error', e);
      this.reconnect(this.getAutoConnect());
    }
  }
  static async uploadFile(file:File,file_id?:string){
    function readFile(file) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        let reader = new FileReader();
        reader.addEventListener("loadend", e => resolve(e.target.result))
        reader.addEventListener("error", reject)
        reader.readAsBinaryString(file)
      })
    }
    if(!file_id){
      file_id = `${file.size}${file.name}${file.lastModified}`;
    }
    debugger
    const file_data = Buffer.from(await readFile(file));
    const url = config.msgServer.msfsUrl;
    const body = new FileImgUploadReq({
      file_data, file_id, file_part: 1, file_total_parts: 1
    }).pack().getPbData();

    const response = await fetch(`${url}`, {
      method: 'POST',
      body,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/protobuf',
      },
    });
    if(response.status != 200){

    }else{
      const result = await response.json();
      console.log(result)
    }
  }
  waitForMsgServerState(
    state: MsgClientState,
    timeout: number = 10000,
    startTime: number = 0
  ) {
    const timeout_ = 500;
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        if (this.getState() === state) {
          resolve(true);
        } else if (timeout > 0 && startTime >= timeout) {
          //console.debug('waitForMsgServerState timeout', startTime, timeout);
          resolve(false);
        } else {
          startTime += timeout_;
          // eslint-disable-next-line promise/catch-or-return
          this.waitForMsgServerState(state, timeout, startTime).then(resolve);
        }
      }, timeout_);
    });
  }

  waitTime(timeout: number = 1000, startTime: number = 0) {
    const timeout_ = 1000;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (startTime >= timeout) {
          resolve();
        } else {
          startTime += timeout_;
          // eslint-disable-next-line promise/catch-or-return
          this.waitTime(timeout, startTime).then(resolve);
        }
      }, timeout_);
    });
  }

  setMsgHandler(msgHandler: any) {
    this.__msgHandler = msgHandler;
  }

  sendPdu(pdu: Pdu) {
    if (
      ActionCommands.CID_AuthLoginReq === pdu.getCommandId() ||
      ActionCommands.CID_AuthCaptchaReq === pdu.getCommandId() ||
      ActionCommands.CID_HeartBeatNotify === pdu.getCommandId() ||
      pdu.getPbBodyLength() === 0
    ) {
      this.client!.send(pdu.getPbData());
    } else {
      const cipherData = AccountController.getInstance(
        this.accountId
      ).aesEncrypt(Buffer.from(pdu.getPbBody()));

      pdu.writeData(
        cipherData,
        pdu.getCommandId(),
        pdu.getSeqNum(),
        1
      );
      this.client!.send(pdu.getPbData());
    }
  }

  async login() {
    const pdu = await this.SendPduWithCallback(
      new AuthCaptchaReq({
        need_sign: !this.serverPubKey,
      }).pack(),
      false
    );
    const msg = AuthCaptchaRes.parseMsg(pdu);
    const captcha = msg.captcha;
    if (msg.sign) {
      const sign1 = msg.sign;
      const resSign = AccountController.getInstance(
        this.accountId
      ).recoverAddressAndPubKey(Buffer.from(sign1!), captcha);
      if (resSign.address !== '0x' + msg.address.toString('hex')) {
        throw new Error('server recover addr error');
      }
      this.serverPubKey = resSign.pubKey;
      await AccountController.getInstance(this.accountId).initEcdh(
        this.serverPubKey!,
        Buffer.from(msg.iv!),
        Buffer.from(msg.aad!)
      );
    }

    const sign = await AccountController.getInstance(
      this.accountId
    ).signMessage(captcha);

    const address = await AccountController.getInstance(
      this.accountId
    ).getAccountAddress();
    AccountController.getInstance(this.accountId).setAddress(address!);

    const pduLogin = await this.SendPduWithCallback(
      new AuthLoginReq({
        address: address!,
        captcha,
        client_type: getClientType(),
        client_version: config.clientVersion,
        sign,
      }).pack(),
      false
    );

    const res = AuthLoginRes.parseMsg(pduLogin);
    const { user_info, error } = res;
    if (error === ERR.NO_ERROR) {
      if (this.sendMsgTimer) {
        clearTimeout(this.sendMsgTimer);
      }
      this.waitForSendingMsg();
      return user_info!;
    } else {
      console.log(ERR[error]);
      if (
        ![
          ERR.E_REASON_NO_ROUTE_SERVER,
          ERR.E_REASON_NO_LOGIN_SERVER,
          ERR.E_REASON_NO_DB_SERVER,
        ].includes(error)
      ) {
        this.autoConnect = false;
      }
      await this.close();
      await this.waitForMsgServerState(MsgClientState.closed);
      throw new Error(ERR[error]);
    }
  }
  onConnected() {
    console.log("onConnected")
    currentMsgConn = this;
    this.notifyState(MsgClientState.connected);
    const client = this;
    this.login()
      .then(async (userInfo: UserInfo_Type) => {
        console.log('loginOk!!', [userInfo.uid, userInfo.address]);
        const account = AccountController.getInstance(client.accountId);
        if(!account.getUid()){
          account.setUid(userInfo.uid);
          await account.saveConfig();
        }

        const userInfoLocal = AccountController.getInstance(
          client.accountId
        ).getUserInfo();
        const msgConnNotify: MsgConnNotify[] = [];
        msgConnNotify.push({
          action:MsgConnNotifyAction.onLoginOk,
          payload:{
            userInfo
          }
        })
        if (!userInfoLocal || diff(userInfoLocal, userInfo)) {
          AccountController.getInstance(client.accountId).setUserInfo(userInfo);
        }
        MsgConn.SendMessage(
          new SwitchDevicesReq({
            ...(await getClientInfo()),
          }).pack()
        );
        client.notify(msgConnNotify);
        this.initGroups();
        return userInfo;
      })
      .catch(console.error);
  }
  notify(notifyList:MsgConnNotify[]) {
    if (this.__msgHandler) {
      this.__msgHandler(this.accountId,notifyList);
    }
  }
  async createGroup(members: number[], group_type: PTPCommon.GroupType,name:string = "",about:string = "",avatar:string = "",) {
    const m = {
      group_type,
      members,
    };
    const pdu = await this.SendPduWithCallback(new GroupPreCreateReq(m).pack());
    const msg1 = GroupPreCreateRes.parseMsg(pdu);
    const { error, group_adr,captcha, group_idx } = msg1;
    if (error == ERR.NO_ERROR && group_adr === '') {
      const { sign } = await AccountController.getInstance(
        this.accountId
      ).signGroupMessage(`${group_idx}${captcha}`, group_idx);
      const pdu1 = await this.SendPduWithCallback(
        new GroupCreateReq({
          avatar: avatar,
          name: name,
          about: about,
          captcha: captcha!,
          group_idx: group_idx,
          sign,
          ...m,
        }).pack()
      );
      const msg = GroupCreateRes.parseMsg(pdu1);
      if (msg.error !== ERR.NO_ERROR) {
        console.log(handleError(msg.error));
      }
      return msg;
    } else {
      return {error};
    }
  }
  async initGroups() {
    const account = AccountController.getInstance(
      this.accountId
    );
    const buddyGetALLRes = await BuddyGetALLReq.run(this.accountId);
    this.notifyState(MsgClientState.logged);
    if (buddyGetALLRes) {

      const buddyGetALLRes_msg = BuddyGetALLRes.parseMsg(buddyGetALLRes!);
      account.BuddyGetALLRes(buddyGetALLRes_msg)
      let groupGetListRes = await GroupGetListReq.run(this.accountId);
      let groupGetListRes_msg = GroupGetListRes.parseMsg(groupGetListRes);
      account.GroupGetListRes(groupGetListRes_msg)
      if(account.getGroupInfoUpdatedTime() == 0 && (!groupGetListRes_msg.groups || groupGetListRes_msg.groups?.length == 0) ){
          await this.createGroup(
            [AccountController.getInstance(this.accountId).getUid()!],
            GroupType.GROUP_TYPE_PAIR
          );
      }
      const groupUnreadMsgRes = await GroupUnreadMsgReq.run(this.accountId);
      let groupUnreadMsgRes_msg = GroupUnreadMsgRes.parseMsg(groupUnreadMsgRes);
      account.GroupUnreadMsgRes(groupUnreadMsgRes_msg);
      BuddyGetALLReq.running = false;

      this.notify([
        {
          action:MsgConnNotifyAction.onInitGroupOk,
          payload:{}
        }
      ])
    }
  }
  onData(e: { data: ArrayBuffer }) {
    let pdu = new Pdu(Buffer.from(e.data));
    const seq_num = pdu.getSeqNum();
    if (pdu.getReversed() === 1) {
      const body = pdu.getPbBody();
      try{
        const bodyPlain = AccountController.getInstance(
          this.accountId
        ).aesDecrypt(Buffer.from(body));

        const cid = pdu.getCommandId();
        pdu = new Pdu();
        pdu.writeData(bodyPlain, cid, seq_num);
      }catch (e){
        console.error("decrypt pdu error");
        return;
      }

    }
    if (pdu.getCommandId() !== ActionCommands.CID_HeartBeatNotify) {
      console.debug(
        'recv',
        `sno: ${seq_num}`,
        getActionCommandsName(pdu.getCommandId())
      );
    }
    if (seq_num > 0) {
      this.__rev_msg_map[seq_num] = pdu;
    }
    if (!this.__sending_msg_map[seq_num]) {
      if (this.__msgHandler) {
        this.__msgHandler(MsgHandler.handlePdu(pdu, this.accountId));
      } else {
        MsgHandler.handlePdu(pdu, this.accountId);
      }
    } else {
      delete this.__sending_msg_map[seq_num];
    }
  }
  notifyState(state: MsgClientState) {
    this.state = state;
    this.notify([
      {
        action: MsgConnNotifyAction.onConnectionStateChanged,
        payload: {
          msgClientState: state,
        },
      },
    ]);
  }
  onClose() {
    if (this.sendMsgTimer) {
      clearTimeout(this.sendMsgTimer);
    }
    console.log('onClose', this.autoConnect);
    this.notifyState(MsgClientState.closed);
    this.reconnect(this.getAutoConnect());
  }

  reconnect(autoConnect: boolean) {
    if (autoConnect) {
      setTimeout(() => {
        if (
          this.state === MsgClientState.closed ||
          this.state === MsgClientState.connect_error
        ) {
          if (reconnect_cnt > 20) {
            reconnect_cnt = 0;
          }
          if (reconnect_cnt < 5) {
            reconnect_cnt += 1;
          } else {
            reconnect_cnt += 2;
          }
          this.connect();
        }
      }, 1000 * (reconnect_cnt + 1));
    }
  }

  static getInstance(accountId: number): MsgConn {
    if (!clients[accountId]) {
      clients[accountId] = new MsgConn(accountId);
    }
    return clients[accountId];
  }

  waitForMsgCallback(
    seq_num: number,
    timeout: number = 5000,
    startTime: number = 0
  ) {
    return new Promise<Pdu>((resolve, reject) => {
      setTimeout(() => {
        if (this.__rev_msg_map[seq_num]) {
          const pdu: Pdu = this.__rev_msg_map[seq_num];
          delete this.__rev_msg_map[seq_num];
          resolve(pdu);
        } else {
          if (startTime >= timeout) {
            reject('TIMEOUT');
          } else {
            startTime += 200;
            if (this.isConnect()) {
              this.waitForMsgCallback(seq_num, timeout, startTime)
                .then(resolve)
                .catch(reject);
            }
          }
        }
      }, 200);
    });
  }
  SendPduWithCallback(
    pdu: Pdu,
    useQueue: boolean = true,
    timeout: number = 5000
  ) {
    return new Promise<Pdu>((resolve, reject) => {
      if (pdu.getSeqNum() > 0) {
        console.debug(
          'send',
          `sno: ${pdu.getSeqNum()}`,
          getActionCommandsName(pdu.getCommandId()),
          this.state,
          this.autoConnect
        );
        if (this.isConnect()) {
          this.__sending_msg_map[pdu.getSeqNum()] = true;
          if (useQueue) {
            this.SendPdu(pdu);
          } else {
            this.sendPdu(pdu);
          }
          this.waitForMsgCallback(pdu.getSeqNum(), timeout)
            .then(resolve)
            .catch(reject);
        } else {
          this.reconnect(this.autoConnect);
          reject('MsgClientState is not connected cid: ' + getActionCommandsName(pdu.getCommandId()));
        }
      } else {
        reject('pdu seq_num is equal 0');
      }
    });
  }

  waitForSendingMsg(time = 1000, count = 0) {
    if (this.isConnect() && this.__sending_msg_list.length > 0) {
      const pdu = this.__sending_msg_list.shift();
      try {
        console.debug(
          'sending... ',
          `sno: ${pdu?.getSeqNum()}`,
          getActionCommandsName(pdu!.getCommandId())
        );
        this.sendPdu(pdu!);
        if (this.__sending_msg_list.length > 0) {
          time = 10;
        }
      } catch (e) {
        console.error(e);
        this.__sending_msg_list.unshift(pdu!);
      }
    } else {
      time = 1000;
    }
    count += time;
    if (this.isConnect() && count >= 10000) {
      if (currentMsgConn && this.accountId !== currentMsgConn?.accountId) {
        this.close();
      } else {
        count = 0;
        this.sendPdu(new HeartBeatNotify({}).pack());
      }
    }

    if (this.isConnect()) {
      this.sendMsgTimer = setTimeout(() => {
        if (this.isConnect()) {
          this.waitForSendingMsg(time, count);
        }
      }, time);
    }
  }

  SendPdu(pdu: Pdu) {
    this.__sending_msg_list.push(pdu);
  }

  isLogged() {
    return [MsgClientState.logged].includes(this.state);
  }
  isConnect() {
    return [MsgClientState.connected, MsgClientState.logged].includes(
      this.state
    );
  }

  static SendMessage(pdu: Pdu) {
    return currentMsgConn?.SendPdu(pdu);
  }
  static getMsgClient() {
    return currentMsgConn;
  }
}
