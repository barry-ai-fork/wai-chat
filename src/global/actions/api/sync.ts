import type {RequiredGlobalActions} from '../../index';
import {addActionHandler, getActions, getGlobal, setGlobal,} from '../../index';
import {addCallback} from '../../../lib/teact/teactn';

import type {ApiChat, ApiMessage} from '../../../api/types';
import {MAIN_THREAD_ID} from '../../../api/types';
import type {ActionReturnType, GlobalState, Thread} from '../../types';

import {CLOUD_MESSAGE_ENABLE, DEBUG, MESSAGE_LIST_SLICE, SERVICE_NOTIFICATIONS_USER_ID} from '../../../config';
import {callApi} from '../../../api/gramjs';
import {buildCollectionByKey} from '../../../util/iteratees';
import {
  addChatMessagesById, addMessageDownloadWaitToSync, addUserDownloadWaitToSync,
  safeReplaceViewportIds,
  updateChats,
  updateListedIds, updateOutlyingIds,
  updateThread,
  updateThreadInfos,
  updateUsers,
} from '../../reducers';
import {
  selectChatFoldersWaitToSync,
  selectChatMessage,
  selectChatMessages,
  selectCurrentMessageList,
  selectDraft,
  selectEditingDraft,
  selectEditingId,
  selectFolderIdsWaitToSync,
  selectFolderTimeWaitToSync, selectLastMessageId, selectListedIds, selectMessagesDownloadWaitToSync,
  selectMessagesWaitToSync,
  selectTabState,
  selectThreadInfo,
  selectUser,
  selectUsersWaitToSync,
  selectWaitToSync,
} from '../../selectors';
import {init as initFolderManager} from '../../../util/folderManager';
import {updateTabState} from '../../reducers/tabs';
import {MessageStoreRow_Type, UserStoreRow_Type} from "../../../lib/ptp/protobuf/PTPCommon/types";
import {MaxSyncMessageToRemote, MaxSyncUserToRemote} from "../../../worker/setting";
import {fetchLocalAllChats, loadChats, setLocalAllChats, updateLocalUser} from "./chats";
import {getViewportSlice} from "./messages";
import {LoadMoreDirection} from "../../../types";

const RELEASE_STATUS_TIMEOUT = 15000; // 15 sec;

let releaseStatusTimeout: number | undefined;

let isSyncToRemote = false;
let isSyncFromRemote = false;
let isWaitToRemote = false;
let pauseSyncToRemote = false;

export function setIsWaitToRemote(isWaitToRemote_:boolean){
  isWaitToRemote = isWaitToRemote_
}

export function setPauseSyncToRemote(pauseSyncToRemote_:boolean){
  pauseSyncToRemote = pauseSyncToRemote_
}

// @ts-ignore
addActionHandler('syncToRemote', async (global, actions): Promise<ActionReturnType> => {
  if(!CLOUD_MESSAGE_ENABLE){
    return
  }
  if(!global.currentAccountAddress){
    return
  }

  const waitToSync = selectWaitToSync(global,global.currentAccountAddress);
  if(!waitToSync){
    return
  }
  if(isSyncToRemote){
    return
  }
  if(pauseSyncToRemote){
    return
  }
  isSyncToRemote = true;
  let isWaitToRemote_ = isWaitToRemote

  try {
    const users0= selectUsersWaitToSync(global,global.currentAccountAddress)
    const messages0= selectMessagesWaitToSync(global,global.currentAccountAddress)

    const users:UserStoreRow_Type[] = []
    const messages:MessageStoreRow_Type[] = []
    const deleteUserIds:string[] = []
    const deleteMessageIds:string[] = []

    const folderIds= selectFolderIdsWaitToSync(global,global.currentAccountAddress)
    const chatFolders = selectChatFoldersWaitToSync(global,global.currentAccountAddress)
    let foldersTime = selectFolderTimeWaitToSync(global,global.currentAccountAddress)

    if(users0){
      const userIds = Object.keys(users0)
      for (let i = 0; i < userIds.length; i++) {
        if(i >= MaxSyncUserToRemote){
          break
        }
        const userId = userIds[i];
        const {isDelete,time} = users0[userId]
        if(isDelete){
          deleteUserIds.push(userId)
        }else{
          const user:any = selectUser(global,userId)
          if(user){
            // @ts-ignore
            users.push({
              time,
              userId:user.id,
              user
            })
          }
        }
      }
    }

    if(messages0){
      const messageIds = Object.keys(messages0)
      for (let i = 0; i < messageIds.length; i++) {
        if(i >= MaxSyncMessageToRemote){
          break
        }
        const messageId = parseInt(messageIds[i]);
        const {isDelete,chatId,time} = messages0[messageId]
        if(isDelete){
          deleteMessageIds.push(`${chatId}_${messageId}`)
        }else{
          const message = selectChatMessage(global,chatId,messageId)
          if(message){
            // @ts-ignore
            messages.push({
              time,
              chatId,
              messageId,
              message
            })
          }
        }
      }
    }
    if(DEBUG){
      console.log("syncToRemote",users,{isWaitToRemote})
    }
    try {
      if(
        deleteMessageIds.length > 0 ||
        deleteUserIds.length > 0 ||
        users.length > 0 ||
        messages.length > 0 ||
        folderIds.length > 0 ||
        chatFolders.length > 0
      ){
        const res = await callApi("invokeSyncToRemoteReq",{
          users,
          messages,
          deleteMessageIds,
          deleteUserIds,
          folderIds,
          chatFolders,
          time:+(new Date())
        })

        if(!res){
          throw new Error("invokeSyncToRemoteReq Error")
        }

        if(global.currentAccountAddress){
          global = getGlobal()
          const waitToSync1 = selectWaitToSync(global,global.currentAccountAddress!);

          if(!waitToSync1){
            return
          }

          let folderIds1= selectFolderIdsWaitToSync(global,global.currentAccountAddress)
          let chatFolders1 = selectChatFoldersWaitToSync(global,global.currentAccountAddress)
          let foldersTime1 = selectFolderTimeWaitToSync(global,global.currentAccountAddress)

          let users1 = selectUsersWaitToSync(global,global.currentAccountAddress)
          let messages1 = selectMessagesWaitToSync(global,global.currentAccountAddress)

          if(foldersTime1 == foldersTime){
            folderIds1 = [];
            chatFolders1 = [];
          }
          if(users1){
            for (let i = 0; i < Object.keys(users1).length; i++) {
              const id = Object.keys(users1)[i]
              if(
                users1[id] && users0[id] &&
                (
                  users1[id].time === users0[id].time
                  || users1[id].time < users0[id].time
                )
              ){
                delete users1[id];
              }
            }
          }

          if(messages1){
            for (let i = 0; i < Object.keys(messages1).length; i++) {
              const id = Object.keys(messages1)[i]
              if(
                messages1[id] && messages0[id] &&
                (
                  messages1[id].time === messages0[id].time
                  || messages1[id].time < messages0[id].time
                )
              ){
                delete messages1[id];
              }
            }
          }


          setGlobal({
            ...global,
            waitToSync:{
              ...global.waitToSync,
              [global.currentAccountAddress!]:{
                ...waitToSync1,
                users:{
                  byId:{
                    ...users1
                  }
                },
                messages:{
                  byId:{
                    ...messages1
                  }
                },
                folders:{
                  ...global.waitToSync?.folders,
                  chatFolders:chatFolders1,
                  folderIds:folderIds1
                }
              }
            }
          })

          if(
            (users1 && Object.keys(users1).length > 0) ||
            (messages1 && Object.keys(messages1).length > 0)){
            isSyncToRemote = false;
            actions.syncToRemote();
            return
          }
        }

      }
    }catch (e) {
      console.error(e)
    }
  }catch (e){
    console.error(e)
  }finally {
    setTimeout(()=>{
      if(isWaitToRemote_){
        isWaitToRemote = false
      }
      isSyncToRemote = false;
    },1000)
  }
})

// @ts-ignore
addActionHandler('syncFromRemote', async (global, actions,payload): Promise<ActionReturnType> => {
  if(!CLOUD_MESSAGE_ENABLE){
    return
  }
  if(!global.currentAccountAddress){
    return
  }
  const {chatId} = payload||{};

  if(!chatId){
    if(isSyncFromRemote || isWaitToRemote){
      return
    }
  }
  isSyncFromRemote = true;

  try {
    if(DEBUG){
      console.log("syncFromRemote",{chatId,isWaitToRemote})
    }
    try {
      if(
        1
      ){
        const userIdsWaitingDownload = []
        let localChats;
        if(chatId){

        }else{
          let syncFromRemoteRes = await callApi("invokeSyncFromRemote",{ chatId,time:+(new Date())})

          if(isWaitToRemote){
            isSyncFromRemote = false;
            return;
          }
          if(!syncFromRemoteRes){
            throw new Error("invokeSyncFromRemote Error")
          }
          let changed = false;
          localChats = fetchLocalAllChats(global.currentAccountAddress)

          if(syncFromRemoteRes.chatsDeleted){
            let flag = false;
            for (let i = 0; i < localChats.chats.length; i++) {
              const chat = localChats.chats[i];
              if(syncFromRemoteRes.chatsDeleted.includes(parseInt(chat.id))){
                changed = true;
                flag = true;
                break
              }
            }
            if(flag){
              localChats.chats = localChats.chats.filter(chat=>{
                return !syncFromRemoteRes.chatsDeleted.includes(parseInt(chat.id))
              })
              localChats.users = localChats.users.filter(user=>{
                return !syncFromRemoteRes.chatsDeleted.includes(parseInt(user.id))
              })
            }
          }
          if(syncFromRemoteRes.folderIds &&
            JSON.stringify(syncFromRemoteRes.folderIds) !== JSON.stringify(localChats.folderIds)
          ){
            changed = true;
            localChats.folderIds = syncFromRemoteRes.folderIds
          }
          if(syncFromRemoteRes.chatFolders &&
            JSON.stringify(syncFromRemoteRes.chatFolders) !== JSON.stringify(localChats.chatFolders)
          ){
            changed = true;
            localChats.chatFolders = syncFromRemoteRes.chatFolders.map(folder=>{
              return {
                "channels": false,
                "pinnedChatIds": [],
                "excludedChatIds": [],
                includedChatIds:[],
                ...folder
              }
            })
          }

          const localChatIds = localChats.chats.map((chat: { id: string; })=>chat.id)

          if(syncFromRemoteRes.chatIds){
            syncFromRemoteRes.chatIds.forEach(chatId=>{
              if(!localChatIds.includes(chatId)){
                changed = true;
                userIdsWaitingDownload.push(chatId)
              }
            })
          }

          if(changed){
            if(isWaitToRemote){
              isSyncFromRemote = false;
              return;
            }
            setLocalAllChats(localChats,global.currentAccountAddress);
            await loadChats(global,
              "active",
              undefined,
              undefined,
              true,
              true,
            );
          }
        }

        if(userIdsWaitingDownload.length > 0 || chatId){
          let syncFromRemoteRes1 = await callApi("invokeSyncFromRemote",{
            userIds:userIdsWaitingDownload,
            chatId,
            time:+(new Date())
          })
          if(isWaitToRemote){
            isSyncFromRemote = false;
            return;
          }
          let changed1 = false;
          localChats = fetchLocalAllChats(global.currentAccountAddress)
          if(syncFromRemoteRes1 && syncFromRemoteRes1.users){
            const usersRes = syncFromRemoteRes1.users;
            for (let i = 0; i < usersRes.length; i++) {
              if(usersRes[i].user){
                changed1 = true;
                updateLocalUser(usersRes[i].user,true,localChats,global.currentAccountAddress,true);
              }
            }
          }
          if(syncFromRemoteRes1 && syncFromRemoteRes1.messageIds && chatId){
            const {messageIds} = syncFromRemoteRes1;
            global = getGlobal();
            if(messageIds.length > 0){
              for (let i = 0; i < messageIds.length; i++) {
                const listIds = selectListedIds(global,chatId,MAIN_THREAD_ID);
                if(!listIds?.includes(messageIds[i])){
                  global = addMessageDownloadWaitToSync(global,messageIds[i])
                }
              }
              setGlobal(global)
            }
          }
          if(changed1){
            if(chatId){
              isWaitToRemote = false
            }
            if(isWaitToRemote){
              isSyncFromRemote = false;
              return;
            }
            global = getGlobal()
            setLocalAllChats(localChats,global.currentAccountAddress);
            await loadChats(global,
              "active",
              undefined,
              undefined,
              true,
              true,
            );

          }
          const downloadMessages = async (chatId:string)=>{
            global = getGlobal();
            const byId = selectMessagesDownloadWaitToSync(global,global.currentAccountAddress)
            const messageIdsWaitDownload = Object.keys(byId);
            const messageIds = [];
            if(messageIdsWaitDownload.length > 0){
              for (let i = 0; i < messageIdsWaitDownload.length; i++) {
                const messageId= messageIdsWaitDownload[i];
                const message = selectChatMessage(global,chatId,parseInt(messageId))
                if(!message){
                  if(i >= MaxSyncMessageToRemote){
                    break
                  }
                  messageIds.push(parseInt(messageId))
                }
              }
            }
            if(messageIds.length > 0){
              let syncFromRemoteRes1 = await callApi("invokeSyncFromRemote",{
                messageIds,
                chatId,
                time:+(new Date())
              })
              if(syncFromRemoteRes1.messages){
                global = getGlobal();
                const messages = [];
                const messagesDownloadWaitToSync = selectMessagesDownloadWaitToSync(global,global.currentAccountAddress);
                for (let i = 0; i < syncFromRemoteRes1.messages.length; i++) {
                  const {message} = syncFromRemoteRes1.messages[i];
                  if(messagesDownloadWaitToSync[message.id]){
                    messages.push(message);
                    delete messagesDownloadWaitToSync[message.id]
                  }
                }
                debugger
                const byId = buildCollectionByKey(messages, 'id');
                global = addChatMessagesById(global, chatId, byId);
                const ids = Object.keys(byId).map(Number);
                global = updateListedIds(global, chatId, MAIN_THREAD_ID,ids);
                const historyIds = selectListedIds(global, chatId, MAIN_THREAD_ID);
                const { newViewportIds } = getViewportSlice(historyIds!,undefined,LoadMoreDirection.Forwards);
                global = safeReplaceViewportIds(global, chatId, MAIN_THREAD_ID, newViewportIds!);

                setGlobal(global);
                if(Object.keys(messagesDownloadWaitToSync).length > 0){
                  await downloadMessages(chatId);
                }
              }
            }
          }
          if(chatId){
            await downloadMessages(chatId);

          }
        }
      }
    }catch (e) {
      console.error(e)
    }
  }catch (e){
    console.error(e)
  }finally {
    setTimeout(()=>{
      isSyncFromRemote = false;
    },2000)
  }
})

addActionHandler('sync', (global, actions): ActionReturnType => {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('>>> START SYNC');
  }
  if (releaseStatusTimeout) {
    clearTimeout(releaseStatusTimeout);
  }

  global = getGlobal();
  global = { ...global, isSyncing: true };
  setGlobal(global);

  // Workaround for `isSyncing = true` sometimes getting stuck for some reason
  releaseStatusTimeout = window.setTimeout(() => {
    global = getGlobal();
    global = { ...global, isSyncing: false };
    setGlobal(global);
    releaseStatusTimeout = undefined;
  }, RELEASE_STATUS_TIMEOUT);
  const { loadAllChats, preloadTopChatMessages, } = actions;

  loadAllChats({
    listType: 'active',
    shouldReplace: true,
    onReplace: async () => {
      // await loadAndReplaceMessages(global, actions);
      global = getGlobal();
      global = {
        ...global,
        lastSyncTime: Date.now(),
        isSyncing: false,
      };
      setGlobal(global);

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('>>> FINISH SYNC');
      }

      initFolderManager();
      loadAllChats({ listType: 'archived', shouldReplace: true });
      void callApi('fetchCurrentUser');
      preloadTopChatMessages();
    },
  });
});

async function loadAndReplaceMessages<T extends GlobalState>(global: T, actions: RequiredGlobalActions) {
  let areMessagesLoaded = false;

  global = getGlobal();

  let wasReset = false;

  // Memoize drafts
  const draftChatIds = Object.keys(global.messages.byChatId);
  /* eslint-disable @typescript-eslint/indent */
  const draftsByChatId = draftChatIds.reduce<Record<string, Record<number, Partial<Thread>>>>((acc, chatId) => {
    acc[chatId] = Object
      .keys(global.messages.byChatId[chatId].threadsById)
      .reduce<Record<number, Partial<Thread>>>((acc2, threadId) => {
        acc2[Number(threadId)] = {
          draft: selectDraft(global, chatId, Number(threadId)),
          editingId: selectEditingId(global, chatId, Number(threadId)),
          editingDraft: selectEditingDraft(global, chatId, Number(threadId)),
        };

        return acc2;
      }, {});
    return acc;
  }, {});
  /* eslint-enable @typescript-eslint/indent */

  for (const { id: tabId } of Object.values(global.byTabId)) {
    global = getGlobal();
    const { chatId: currentChatId, threadId: currentThreadId } = selectCurrentMessageList(global, tabId) || {};
    const activeThreadId = currentThreadId || MAIN_THREAD_ID;
    const threadInfo = currentThreadId && currentChatId
      ? selectThreadInfo(global, currentChatId, currentThreadId) : undefined;
    const currentChat = currentChatId ? global.chats.byId[currentChatId] : undefined;
    if (currentChatId && currentChat) {
      const result = await loadTopMessages(currentChat, activeThreadId, threadInfo?.lastReadInboxMessageId);
      global = getGlobal();
      const { chatId: newCurrentChatId } = selectCurrentMessageList(global, tabId) || {};

      if (result && newCurrentChatId === currentChatId) {
        const currentChatMessages = selectChatMessages(global, currentChatId);
        const localMessages = currentChatId === SERVICE_NOTIFICATIONS_USER_ID
          ? global.serviceNotifications.filter(({ isDeleted }) => !isDeleted).map(({ message }) => message)
          : [];
        const topicLastMessages = currentChat.isForum && currentChat.topics
          ? Object.values(currentChat.topics)
            .map(({ lastMessageId }) => currentChatMessages[lastMessageId])
            .filter(Boolean)
          : [];

        const allMessages = ([] as ApiMessage[]).concat(result.messages, localMessages);
        const allMessagesWithTopicLastMessages = allMessages.concat(topicLastMessages);
        const byId = buildCollectionByKey(allMessagesWithTopicLastMessages, 'id');
        const listedIds = allMessages.map(({ id }) => id);

        if (!wasReset) {
          global = {
            ...global,
            messages: {
              ...global.messages,
              byChatId: {},
            },
          };
          // eslint-disable-next-line @typescript-eslint/no-loop-func
          Object.values(global.byTabId).forEach(({ id: otherTabId }) => {
            global = updateTabState(global, {
              tabThreads: {},
            }, otherTabId);
          });
          wasReset = true;
        }

        global = addChatMessagesById(global, currentChatId, byId);
        global = updateListedIds(global, currentChatId, activeThreadId, listedIds);
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        Object.values(global.byTabId).forEach(({ id: otherTabId }) => {
          const { chatId: otherChatId, threadId: otherThreadId } = selectCurrentMessageList(global, otherTabId) || {};
          if (otherChatId === currentChatId && otherThreadId === activeThreadId) {
            global = safeReplaceViewportIds(global, currentChatId, activeThreadId, listedIds, otherTabId);
          }
        });
        global = updateChats(global, buildCollectionByKey(result.chats, 'id'));
        global = updateUsers(global, buildCollectionByKey(result.users, 'id'));
        if (result.repliesThreadInfos.length) {
          global = updateThreadInfos(global, currentChatId, result.repliesThreadInfos);
        }

        areMessagesLoaded = true;
      }
    }

    setGlobal(global);

    if (currentChat?.isForum) {
      actions.loadTopics({ chatId: currentChatId!, force: true });
      if (currentThreadId && currentThreadId !== MAIN_THREAD_ID) {
        actions.loadTopicById({
          chatId: currentChatId!, topicId: currentThreadId, shouldCloseChatOnError: true,
        });
      }
    }
  }

  global = getGlobal();

  if (!areMessagesLoaded) {
    global = {
      ...global,
      messages: {
        ...global.messages,
        byChatId: {},
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    Object.values(global.byTabId).forEach(({ id: otherTabId }) => {
      global = updateTabState(global, {
        tabThreads: {},
      }, otherTabId);
    });
  }

  // Restore drafts
  // eslint-disable-next-line @typescript-eslint/no-loop-func
  Object.keys(draftsByChatId).forEach((chatId) => {
    const threads = draftsByChatId[chatId];
    Object.keys(threads).forEach((threadId) => {
      global = updateThread(global, chatId, Number(threadId), draftsByChatId[chatId][Number(threadId)]);
    });
  });

  setGlobal(global);

  Object.values(global.byTabId).forEach(({ id: tabId }) => {
    const { chatId: audioChatId, messageId: audioMessageId } = selectTabState(global, tabId).audioPlayer;
    if (audioChatId && audioMessageId && !selectChatMessage(global, audioChatId, audioMessageId)) {
      actions.closeAudioPlayer({ tabId });
    }
  });
}

function loadTopMessages(chat: ApiChat, threadId: number, lastReadInboxId?: number) {
  return callApi('fetchMessages', {
    chat,
    threadId,
    offsetId: lastReadInboxId || chat.lastReadInboxMessageId,
    addOffset: -(Math.round(MESSAGE_LIST_SLICE / 2) + 1),
    limit: MESSAGE_LIST_SLICE,
  });
}

let previousGlobal: GlobalState | undefined;
// RAF can be unreliable when device goes into sleep mode, so sync logic is handled outside any component
addCallback((global: GlobalState) => {
  const { connectionState, authState,msgClientState } = global;
  getActions().syncToRemote();
  const { isMasterTab } = selectTabState(global);
  if (!isMasterTab || (
    previousGlobal?.connectionState === connectionState
    && previousGlobal?.authState === authState
    && previousGlobal?.msgClientState === msgClientState
  )) {
    previousGlobal = global;
    return;
  }

  if (
    connectionState === 'connectionStateReady' && authState === 'authorizationStateReady'
    && (
      msgClientState === 'connectionStateConnected' ||
      msgClientState === 'connectionStateLogged'
    )
  ) {
    if(DEBUG){
      console.log({connectionState,msgClientState,authState})
      console.log("================> sync")
    }
    getActions().sync();
    getActions().syncFromRemote()
  }
  previousGlobal = global;
});
