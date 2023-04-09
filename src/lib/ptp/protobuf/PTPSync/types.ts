// DO NOT EDIT
import type * as PTPCommon from '../PTPCommon/types';

export interface SyncFromRemoteReq_Type {
  userIds?: string[];
  messageIds?: number[];
  chatId?: string;
  time: number;
}
export interface SyncFromRemoteRes_Type {
  users?: PTPCommon.UserStoreRow_Type[];
  chatIds?: string[];
  chatFolders?: PTPCommon.PbChatFolder_Type[];
  folderIds?: number[];
  chatsDeleted?: number[];
  messageIds?: number[];
  messages?: PTPCommon.MessageStoreRow_Type[];
  err: PTPCommon.ERR;
}
export interface SyncToRemoteReq_Type {
  messages?: PTPCommon.MessageStoreRow_Type[];
  users?: PTPCommon.UserStoreRow_Type[];
  deleteUserIds?: string[];
  deleteMessageIds?: string[];
  chatFolders?: PTPCommon.PbChatFolder_Type[];
  folderIds?: number[];
  time: number;
}
export interface SyncToRemoteRes_Type {
  err: PTPCommon.ERR;
}
