import { diff } from 'deep-object-diff';

import config, {getGroupLocalKey} from './config';
import type {
  GroupInfo_Type,
  GroupMember_Type,
  MsgInfo_Type,
} from '../protobuf/PTPCommon';
import { GroupInfo, MsgInfo } from '../protobuf/PTPCommon';

import DbStorage from './DbStorage';

let groups: Record<number, GroupController> = {};
let GroupAdrGroupIdMap: Record<string, number> = {};
let GroupIdGroupAdrMap: Record<number, string> = {};

export default class GroupController {
  private readonly group_id: number;
  private groupInfo?: GroupInfo_Type;
  private messages: Record<number, MsgInfo_Type>;
  private messageIds: number[];
  private messageSendingIds: number[];
  private groupMembers: GroupMember_Type[];
  private messageSendingIdsLoaded: boolean;
  constructor(group_id: number) {
    this.group_id = group_id;
    this.groupMembers = [];
    this.messages = {};
    this.messageIds = [];
    this.messageSendingIdsLoaded = false;
    this.messageSendingIds = [];
  }
  async init(){

  }
  getMessage(sentAt: number) {
    return this.messages[sentAt] || null;
  }
  async getMessageFromDb(msg_id: number) {
    const msgHex = await DbStorage.getItem(
      `${config.dbPrefix.Msg}${this.group_id}.${msg_id}`
    );
    if (msgHex) {
      return new MsgInfo().fromHex(msgHex);
    } else {
      return null;
    }
  }
  getMessageIds() {
    return this.messageIds;
  }
  getMessages() {
    return this.messages;
  }
  getGroupMembers() {
    return this.groupMembers!;
  }
  setGroupMembers(members: GroupMember_Type[]) {
    this.groupMembers = members;
  }
  getGroupInfo() {
    return this.groupInfo!;
  }
  setGroupInfo(groupInfo: GroupInfo_Type) {
    if (!this.groupInfo || diff(this.groupInfo, groupInfo)) {
      this.groupInfo = groupInfo;
      GroupAdrGroupIdMap[groupInfo.group_adr] = groupInfo.group_id;
      GroupIdGroupAdrMap[groupInfo.group_id] = groupInfo.group_adr;
    }
  }
  getId() {
    return this.group_id;
  }
  static getGroupIdByGroupAdr(group_adr: string) {
    return GroupAdrGroupIdMap[group_adr] || null;
  }
  static getGroupAdrByGroupId(group_id: number) {
    return GroupIdGroupAdrMap[group_id] || null;
  }
  async saveGroupInfoToDb(groupInfo: GroupInfo_Type) {
    if (!this.groupInfo || diff(this.groupInfo, groupInfo)) {
      this.setGroupInfo(groupInfo);
      const key = getGroupLocalKey(groupInfo);
      const hex = new GroupInfo(groupInfo).toHex();
      await DbStorage.setItem(key, hex);
    }
  }
  async getGroupInfoFromDb() {
    const key = getGroupLocalKey({ group_id: this.group_id });
    const hex = await DbStorage.getItem(key);
    if (hex) {
      const groupInfo = new GroupInfo().fromHex(hex);
      this.setGroupInfo(groupInfo);
      return groupInfo;
    } else {
      return null;
    }
  }
  async initSendingMsg() {
    let msgInfoList: MsgInfo_Type[] = [];
    if (this.messageSendingIds.length === 0 && !this.messageSendingIdsLoaded) {
      const messageSendingIdsStr = await DbStorage.getItem(
        `${config.dbPrefix.MsgSending}${this.group_id}`
      );
      this.messageSendingIdsLoaded = true;
      if (messageSendingIdsStr) {
        this.messageSendingIds = JSON.parse(messageSendingIdsStr);
        for (let i = 0; i < this.messageSendingIds.length; i++) {
          const sent_at = this.messageSendingIds[i];
          const msgInfoHex = await DbStorage.getItem(
            `${config.dbPrefix.Msg}${this.group_id}.${sent_at}`
          );
          if (msgInfoHex) {
            msgInfoList.push(new MsgInfo().fromHex(msgInfoHex));
          }
        }
      }
    }
    return msgInfoList;
  }
  saveMsg(msgList: MsgInfo_Type[], skipSaveMsgToDb: boolean = false) {
    let changed = false;
    let sendingChanged = false;
    for (let i = 0; i < msgList.length; i++) {
      const msg = msgList[i];
      const sent_at = msg.sent_at;
      if (!this.messages[sent_at] || diff(this.messages[sent_at], msg)) {
        if (this.messageSendingIds.includes(sent_at) && msg.msg_id > 0) {
          this.removeSendingMessage(sent_at);
        }
        this.messages[sent_at] = msg;
        if (!skipSaveMsgToDb && msg.msg_id > 0) {
          DbStorage.setItem(
            `${config.dbPrefix.Msg}${this.group_id}.${msg.msg_id}`,
            new MsgInfo(msg).toHex()
          );
        }
        if (msg.msg_id === 0) {
          if (!this.messageSendingIds.includes(msg.sent_at)) {
            sendingChanged = true;
            this.messageSendingIds = [...this.messageSendingIds, msg.sent_at];
            DbStorage.setItem(
              `${config.dbPrefix.Msg}${this.group_id}.${msg.sent_at}`,
              new MsgInfo(msg).toHex()
            );
          }
        }
      }
      if (this.messageIds.indexOf(sent_at) === -1) {
        changed = true;
        this.messageIds = [...this.messageIds, sent_at];
      }
      if (sendingChanged) {
        DbStorage.setItem(
          `${config.dbPrefix.MsgSending}${this.group_id}`,
          JSON.stringify(this.messageSendingIds)
        );
      }
    }

    if (changed) {
      this.messageIds.sort((a, b) => b - a);
    }

    return this.messageIds;
  }
  removeSendingMessage(sent_at: number) {
    this.messageSendingIds = this.messageSendingIds.filter(
      (id) => id !== sent_at
    );
    DbStorage.removeItem(`${config.dbPrefix.MsgSending}${this.group_id}`);
    DbStorage.setItem(
      `${config.dbPrefix.MsgSending}${this.group_id}`,
      JSON.stringify(this.messageSendingIds)
    );
  }
  static getInstance(group_id: number) {
    if (!groups[group_id]) {
      groups[group_id] = new GroupController(group_id);
    }
    return groups[group_id];
  }
}
