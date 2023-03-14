import {BASE_API, SESSION_TOKEN, WS_URL} from '../../config';
import {bufferToString} from "../../worker/helpers/buffer";
import {decode} from "worktop/buffer";

export enum MsgConnNotifyAction{
  onInitAccount,
  onConnectionStateChanged,
  onLoginOk,
  onInitGroupOk,
  onData
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
let seq_num = 0;
let clients: Record<number, MsgConn> = {};

let currentMsgConn: MsgConn | null = null;

export default class MsgConn {
  private accountId: number;
  private serverPubKey?: Buffer;
  private autoConnect: boolean;
  public state: MsgClientState;
  public client: WebSocket | any | undefined;
  private __rev_msg_map: Record<number, any>;
  private __sending_msg_map: Record<number, boolean>;
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
      this.state === MsgClientState.connected
    ) {
      return;
    }
    try {
      if (
        currentMsgConn?.isConnect() &&
        currentMsgConn?.getAccountId() !== this.accountId
      ) {
        if(currentMsgConn){
          currentMsgConn!.setAutoConnect(false);
          currentMsgConn!.close();
        }
      }
      this.notifyState(MsgClientState.connecting);
      this.client = new WebSocket(`${WS_URL}`);
      // this.client.binaryType = 'arraybuffer';
      this.client.onopen = this.onConnected.bind(this);
      this.client.onmessage = this.onData.bind(this);
      this.client.onclose = this.onClose.bind(this);
    } catch (e) {
      console.error('connect error', e);
      this.reconnect(this.getAutoConnect());
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

  onConnected() {
    console.log("onConnected")
    currentMsgConn = this;
    this.notifyState(MsgClientState.connected);
    let user_auth_json = localStorage.getItem(SESSION_TOKEN);
    if(user_auth_json){
      const {token} = JSON.parse(user_auth_json);
      this.login(token);
    }
  }
  login(token){
    this.sendJson({
      action:"login",
      seq_num:0,
      data:{
        token
      },
    })
  }
  notify(notifyList:MsgConnNotify[]) {
    if (this.__msgHandler) {
      this.__msgHandler(this.accountId,notifyList);
    }
  }
  onData(e: { data: String }) {
    let msg;
    try {
      msg = JSON.parse(e.data);
    }catch (e){
      console.error("parse msg error")
    }
    if(msg){
      if(this.__sending_msg_map[msg.seq_num]){
        this.__rev_msg_map[msg.seq_num] = msg
        delete this.__sending_msg_map[msg.seq_num];
      }else{
        if (this.__msgHandler) {
          this.__msgHandler(msg);
          this.notify([
            {
              action: MsgConnNotifyAction.onData,
              payload: msg,
            },
          ]);
        }
      }
    }else{

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
    return new Promise<Record<string, any>>((resolve, reject) => {
      setTimeout(() => {
        if (this.__rev_msg_map[seq_num]) {
          const res = this.__rev_msg_map[seq_num];
          delete this.__rev_msg_map[seq_num];
          resolve(res);
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
  sendJsonWithCallback(
    data,
    timeout: number = 10000
  ) {
    return new Promise<Record<string, any>>((resolve, reject) => {
      if (this.isConnect()) {
        data.seq_num = ++seq_num;
        this.__sending_msg_map[data.seq_num] = true;
        this.sendJson(data)
        this.waitForMsgCallback(data.seq_num, timeout)
          .then(resolve)
          .catch(reject);
      } else {
        this.reconnect(this.autoConnect);
        reject('MsgClientState is not connected');
      }
    });
  }

  isLogged() {
    return [MsgClientState.logged].includes(this.state);
  }
  isConnect() {
    return [MsgClientState.connected, MsgClientState.logged].includes(
      this.state
    );
  }
  sendJson(data:Object){
    this.client.send(JSON.stringify(data))
  }
  static getMsgClient() {
    return currentMsgConn;
  }
}
