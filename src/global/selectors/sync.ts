import type {GlobalState, WaitToSyncType} from '../types';
import {PbChatFolder_Type} from "../../lib/ptp/protobuf/PTPCommon/types";

export function selectWaitToSync<T extends GlobalState>(global: T, accountAddress: string): WaitToSyncType | undefined {
  return global.waitToSync ? global.waitToSync[accountAddress]:undefined;
}

export function selectFolderIdsWaitToSync<T extends GlobalState>(global: T, accountAddress: string): number[] {
  if(
    global.waitToSync
    && global.waitToSync[accountAddress]
    && global.waitToSync[accountAddress].folders
    && global.waitToSync[accountAddress].folders.folderIds
  ){
    return global.waitToSync![accountAddress].folders!.folderIds || []
  }else{
    return []
  }
}

export function selectFolderTimeWaitToSync<T extends GlobalState>(global: T, accountAddress: string): number|undefined {
  if(
    global.waitToSync
    && global.waitToSync[accountAddress]
    && global.waitToSync[accountAddress].folders
    && global.waitToSync[accountAddress].folders.time
  ){
    return global.waitToSync![accountAddress]!.folders!.time
  }else{
    return undefined
  }
}



export function selectChatFoldersWaitToSync<T extends GlobalState>(global: T, accountAddress: string): PbChatFolder_Type[] {
  if(
    global.waitToSync
    && global.waitToSync[accountAddress]
    && global.waitToSync[accountAddress].folders
    && global.waitToSync[accountAddress].folders.chatFolders
  ){
    return global.waitToSync![accountAddress].folders!.chatFolders || []
  }else{
    return []
  }
}

export function selectUsersWaitToSync<T extends GlobalState>(global: T, accountAddress: string): Record<string, {
  isDelete:boolean;
  time:number
}> {
  if(
    global.waitToSync
    && global.waitToSync[accountAddress]
    && global.waitToSync[accountAddress].users
    && global.waitToSync[accountAddress].users.byId
  ){
    return global.waitToSync![accountAddress].users!.byId || {}
  }else{
    return {}
  }
}

export function selectMessagesWaitToSync<T extends GlobalState>(global: T, accountAddress: string): Record<string, {
  isDelete:boolean;
  chatId:string,
  time:number
}> {
  if(
    global.waitToSync
    && global.waitToSync[accountAddress]
    && global.waitToSync[accountAddress].messages
    && global.waitToSync[accountAddress].messages.byId
  ){
    return global.waitToSync![accountAddress].messages!.byId || {}
  }else{
    return {}
  }
}

export function selectMessagesDownloadWaitToSync<T extends GlobalState>(global: T, accountAddress: string): Record<string, {
  time:number
}> {
  if(
    global.waitToSync
    && global.waitToSync[accountAddress]
    && global.waitToSync[accountAddress].messagesDownload
    && global.waitToSync[accountAddress].messagesDownload.byId
  ){
    return global.waitToSync![accountAddress].messagesDownload!.byId || {}
  }else{
    return {}
  }
}

