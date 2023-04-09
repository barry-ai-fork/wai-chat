import type {GlobalState} from '../types';
import {ApiChatFolder} from "../../api/types";

export function updateFolderWaitToSync<T extends GlobalState>(
  global: T,
  orderedIds:number[] = [],
  chatFolders:ApiChatFolder[] = [],
  ): T {
  const chatFoldersById:Record<string, ApiChatFolder> = {};
  if(chatFolders.length > 0){
    chatFolders.forEach(row=>{
      chatFoldersById[row.id] = row;
    })
  }
  if(global.currentAccountAddress){
    const accountWaitForSync = (global.waitToSync && global.waitToSync[global.currentAccountAddress]) ? global.waitToSync[global.currentAccountAddress]:{}
    return {
      ...global,
      waitToSync: {
        ...global.waitToSync,
        [global.currentAccountAddress]: {
          ...accountWaitForSync,
          folders:{
            folderIds:orderedIds,
            chatFolders,
            time:+(new Date)
          }
        }
      },
      chatFolders: {
        ...global.chatFolders,
        byId: {
          ...global.chatFolders.byId,
          ...(chatFolders?.length > 0 ? chatFoldersById :{})
        },
        orderedIds: orderedIds.length > 0 ? orderedIds : global.chatFolders.orderedIds,
      },
    };
  }else{
    return {
      ...global,
      chatFolders: {
        ...global.chatFolders,
        byId: {
          ...global.chatFolders.byId,
          ...(chatFolders?.length > 0 ? chatFoldersById :{})
        },
        orderedIds: orderedIds.length > 0 ? orderedIds : global.chatFolders.orderedIds,
      },
    }
  }
}

export function updateUserWaitToSync<T extends GlobalState>(
  global: T,
  userId:string,
  isDelete:boolean = false,
  folderId?:number,
): T {
  if(global.currentAccountAddress){
    const changedChatFolders:Record<string, ApiChatFolder> = {}
    Object.values(global.chatFolders.byId)?.forEach((row:ApiChatFolder)=>{
      let flag = false;
      if(isDelete){
        if(row.includedChatIds && row.includedChatIds.includes(userId)){
          flag = true;
          row.includedChatIds = row.includedChatIds.filter((id: string)=>id !== userId)
        }
        if(row.pinnedChatIds && row.pinnedChatIds.includes(userId)){
          flag = true;
          row.pinnedChatIds = row.pinnedChatIds.filter((id: string)=>id !== userId)
        }
        if(row.excludedChatIds && row.excludedChatIds.includes(userId)){
          flag = true;
          row.excludedChatIds = row.excludedChatIds.filter((id: string)=>id !== userId)
        }
        if(flag){
          changedChatFolders[row.id] = row
        }
      }else{
        if(folderId){
          if(row.includedChatIds && !row.includedChatIds.includes(userId)){
            flag = true;
            row.includedChatIds.push(userId)
          }
          if(flag){
            changedChatFolders[row.id] = row
          }
        }
      }
    })
    const accountWaitForSync = (global.waitToSync && global.waitToSync[global.currentAccountAddress]) ? global.waitToSync[global.currentAccountAddress]:{}
    if(Object.values(changedChatFolders).length > 0){
      global = updateFolderWaitToSync(global,[],Object.values(changedChatFolders))
    }
    return {
      ...global,
      waitToSync:{
        ...global.waitToSync,
        [global.currentAccountAddress!]:{
          ...accountWaitForSync,
          users:{
            byId:{
              ...accountWaitForSync.users?.byId,
              [userId]:{
                isDelete,
                time:+(new Date())
              }
            }
          }
        }
      }
    }
  }else{
    return global
  }
}

export function updateMessageWaitToSync<T extends GlobalState>(
  global: T,
  chatId:string,
  messageId:number,
  isDelete:boolean = false,
): T {
  if(global.currentAccountAddress){
    const accountWaitForSync = (global.waitToSync && global.waitToSync[global.currentAccountAddress]) ? global.waitToSync[global.currentAccountAddress]:{}
    return {
      ...global,
      waitToSync:{
        ...global.waitToSync,
        [global.currentAccountAddress]:{
          ...accountWaitForSync,
          messages:{
            byId:{
              ...accountWaitForSync.messages?.byId,
              [messageId]:{
                chatId,
                isDelete,
                time:+(new Date())
              }
            }
          }
        }
      }
    }
  }else{
    return global
  }
}

export function addMessageDownloadWaitToSync<T extends GlobalState>(
  global: T,
  messageId:string,
): T {
  if(global.currentAccountAddress){
    const accountWaitForSync = (global.waitToSync && global.waitToSync[global.currentAccountAddress]) ? global.waitToSync[global.currentAccountAddress]:{}
    return {
      ...global,
      waitToSync:{
        ...global.waitToSync,
        [global.currentAccountAddress]:{
          ...accountWaitForSync,
          messagesDownload:{
            byId:{
              ...accountWaitForSync.messagesDownload?.byId,
              [messageId]:{
                time:+(new Date())
              }
            }
          }
        }
      }
    }
  }else{
    return global
  }
}
