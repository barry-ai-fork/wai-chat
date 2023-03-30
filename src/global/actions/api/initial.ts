import {addActionHandler, getGlobal, setGlobal,} from '../../index';

import {callApi, callApiLocal, initApi} from '../../../api/gramjs';

import {
  CUSTOM_BG_CACHE_NAME, DEBUG,
  GLOBAL_STATE_CACHE_KEY,
  IS_TEST,
  LANG_CACHE_NAME,
  LOCK_SCREEN_ANIMATION_DURATION_MS,
  MEDIA_CACHE_NAME,
  MEDIA_CACHE_NAME_AVATARS,
  MEDIA_PROGRESSIVE_CACHE_NAME,
} from '../../../config';
import {IS_MOV_SUPPORTED, IS_WEBM_SUPPORTED, MAX_BUFFER_SIZE, PLATFORM_ENV,} from '../../../util/environment';
import {unsubscribe} from '../../../util/notifications';
import * as cacheApi from '../../../util/cacheApi';
import {updateAppBadge} from '../../../util/appBadge';
import {
  clearLegacySessions,
  clearStoredSession,
  importLegacySession,
  loadStoredSession,
  storeSession,
} from '../../../util/sessions';
import {
  addChats,
  addUsers, addUserStatuses,
  clearGlobalForLockScreen, replaceChats,
  replaceUsers,
  updateChat,
  updateChats,
  updatePasscodeSettings,
  updateUsers
} from '../../reducers';
import {clearEncryptedSession, encryptSession, forgetPasscode} from '../../../util/passcode';
import {serializeGlobal} from '../../cache';
import {parseInitialLocationHash} from '../../../util/routing';
import type {ActionReturnType} from '../../types';
import {buildCollectionByKey} from '../../../util/iteratees';
import MsgConn, {MsgClientState, MsgConnNotify, MsgConnNotifyAction} from "../../../lib/ptp/client/MsgConn";
import parseMessageInput from "../../../util/parseMessageInput";
import Account from "../../../worker/share/Account";
import {ApiUpdateConnectionStateType} from "../../../api/types";
import LocalStorage from "../../../worker/share/db/LocalStorage";
import {AuthPreLoginReq, AuthPreLoginRes, UploadProfilePhotoRes} from "../../../lib/ptp/protobuf/PTPAuth";
import {getCurrentTabId} from "../../../util/establishMultitabRole";
import {SendRes} from "../../../lib/ptp/protobuf/PTPMsg";
import {ERR} from "../../../lib/ptp/protobuf/PTPCommon/types";
import UploadProfilePhotoReq from "../../../lib/ptp/protobuf/PTPAuth/UploadProfilePhotoReq";
import Mnemonic from "../../../lib/ptp/wallet/Mnemonic";
import {hashSha256} from "../../../worker/share/utils/helpers";
import {selectChat, selectUser} from "../../selectors";

addActionHandler('updateGlobal', (global,action,payload): ActionReturnType => {
  return {
    ...global,
    ...payload,
  };
});

addActionHandler('updateMsg', (global,actions,payload:any): ActionReturnType => {
  try{
    const sendRes = SendRes.parseMsg(payload!)
    if(!sendRes.payload){
      return ;
    }
    const payloadData = JSON.parse(sendRes.payload)
    if(DEBUG){
      console.log(`[${sendRes.action}]`,payloadData)
    }
    switch (sendRes.action){
      case "removeBot":
        if(global.chats.listIds && global.chats.listIds.active){
          let listIds_active = global.chats.listIds.active
          listIds_active = listIds_active!.filter(id=>id !== payloadData.chatId)
          actions.updateGlobal({
            chats:{
              ...global.chats,
              listIds: {
                ...global.chats.listIds,
                active:listIds_active
              },
              totalCount: {
                ...global.chats.totalCount,
                all:listIds_active.length
              }
            }
          })
          // @ts-ignore
          actions.openChat({ id: undefined }, { forceOnHeavyAnimation: true });
          actions.loadAllChats({ listType: 'active', shouldReplace: true });
        }

        break
      case "loadChats":
      case "createBot":
        actions.loadAllChats({ listType: 'active', shouldReplace: true });
        break
      case "clearHistory":
        actions.updateGlobal({
          messages:{
            ...global.messages,
            byChatId: {
              ...global.messages.byChatId,
              [payloadData.chatId]:{
                ...global.messages.byChatId[payloadData.chatId],
                byId:{},
                threadsById:{
                  "-1":{
                    ...global.messages.byChatId[payloadData.chatId].threadsById["-1"],
                    lastScrollOffset:undefined,
                    lastViewportIds: [],
                    listedIds:[]
                  }
                }
              }
            }
          },
          chats:{
            ...global.chats,
            byId:{
              ...global.chats.byId,
              [payloadData.chatId]:{
                ...global.chats.byId[payloadData.chatId],
                lastMessage:undefined
              }
            }
          }
        })
        break
      case "updateGlobal":
        const chat_listIds_active = global.chats.listIds.active || []
        if(payloadData.chats){
          for (let i = 0; i < payloadData.chats.length; i++) {
            const chat1 = payloadData.chats[i]
            const chat = selectChat(global,chat1.id)
            if(!chat_listIds_active.includes(chat1.id)){
              chat_listIds_active.push(chat1.id)
            }
            if(chat){
              global = replaceChats(global,{
                ...global.chats.byId,
                [chat1.id]:{
                  ...chat,
                  ...chat1,
                }
              });
            }else{
              const chatFolders = global.chatFolders;
              if(!chatFolders.byId["1"].includedChatIds.includes(chat1.id)){
                chatFolders.byId["1"].includedChatIds.push(chat1.id)
              }
              global = {
                ...global,
                chats:{
                  ...global.chats,
                  byId:{
                    ...global.chats.byId,
                    [chat1.id]:{
                      ...chat1,
                    }
                  }
                },
                chatFolders
              }
            }
          }
        }
        if(payloadData.users){
          for (let i = 0; i < payloadData.users.length; i++) {
            const user1 = payloadData.users[i]
            const user = selectUser(global,user1.id)
            if(user){
              global = replaceUsers(global,{
                ...global.users.byId,
                [user1.id]:{
                  ...user,
                  ...user1,
                }
              });
            }else{
              global = addUsers(global,{
                [user1.id]:{
                  ...user1,
                }
              });
              if(user1.fullInfo && user1.fullInfo.botInfo){
                global = addUserStatuses(global,{
                  [user1.id]:{
                    type:'userStatusEmpty'
                  }
                });
              }
            }
          }
        }
        actions.updateGlobal({
          chats:{
            ...global.chats,
            listIds:{
              ...global.chats.listIds,
              active:chat_listIds_active
            },
            totalCount:{
              all:chat_listIds_active.length
            }
          },
          users:global.users,
          chatFolders:global.chatFolders,
        })
        break
      case "newMessage":
      case "updateMessage":
      case "updateMessageSendSucceeded":
        handleRecvMsg(global,actions,sendRes.action,payloadData)
        break
      default:
        const {action,...data} = payload;
        actions.apiUpdate({
          '@type': sendRes.action,
          ...payloadData
        });
        break
    }
  }catch (e){
    console.error(e)
  }
});

const handleRecvMsg = (global:any,actions:any,action:string,data:any)=>{
  let {msg,localMsgId} = data;
  console.log("[handleRecvMsg]",action,data)
  const {chatId,content} = msg;
  if(!msg.isOutgoing && content.text && content.text.text){
    const { text, entities } = parseMessageInput(content.text.text);
    msg.content.text.text = text;
    if(msg.content.text.entities){
      msg.content.text.entities ={
        ...msg.content.text.entities,
        ...entities
      }
    }else{
      msg.content.text.entities = entities
    }
  }
  actions.apiUpdate({
    '@type': action,
    localId: localMsgId,
    chatId: chatId,
    message: {
      sendingState:undefined,
      ...msg
    },
  });
}

addActionHandler('initApi', async (global, actions): Promise<void> => {
  if (!IS_TEST) {
    await importLegacySession();
    void clearLegacySessions();
  }

  const initialLocationHash = parseInitialLocationHash();

  void initApi(actions.apiUpdate, {
    userAgent: navigator.userAgent,
    platform: PLATFORM_ENV,
    sessionData: loadStoredSession(),
    isTest: window.location.search.includes('test') || initialLocationHash?.tgWebAuthTest === '1',
    isMovSupported: IS_MOV_SUPPORTED,
    isWebmSupported: IS_WEBM_SUPPORTED,
    maxBufferSize: MAX_BUFFER_SIZE,
    webAuthToken: initialLocationHash?.tgWebAuthToken,
    dcId: initialLocationHash?.tgWebAuthDcId ? Number(initialLocationHash?.tgWebAuthDcId) : undefined,
    mockScenario: initialLocationHash?.mockScenario,
  });
  actions.updateGlobal({
    authState:'authorizationStateReady'
  })
  Account.setKvStore(new LocalStorage())
  const accountId = Account.getCurrentAccountId();
  let account = Account.getInstance(accountId);
  await account.loadSession()
  const msgConn = new MsgConn(accountId);
  msgConn.setMsgHandler(async (accountId:number,notifys:MsgConnNotify[])=>{
    if(notifys && notifys.length > 0){
      for (let i = 0; i < notifys.length; i++) {
        const notify = notifys[i];
        switch (notify.action){
          case MsgConnNotifyAction.onConnectionStateChanged:
            const {msgClientState} = notify.payload;
            let connectionState:ApiUpdateConnectionStateType;
            if(msgClientState === MsgClientState.connected || msgClientState === MsgClientState.logged){
              connectionState = "connectionStateReady"
              if(msgClientState === MsgClientState.logged){
                account = Account.getInstance(msgConn.getAccountId())
                actions.updateGlobal({
                  currentUserId:account.getUid(),
                  users:{
                    ...global.users,
                    byId:{
                      ...global.users.byId,
                      [account.getUid()!]:account.getUserInfo()
                    }
                  }
                });
              }
            }else if(msgClientState === MsgClientState.connecting || msgClientState === MsgClientState.closed){
              connectionState = "connectionStateConnecting"
            }else{
              connectionState = "connectionStateBroken";
            }
            actions.updateGlobal({
              connectionState
            });
            break
          case MsgConnNotifyAction.onData:
            const payload = notify.payload;
            actions.updateMsg(payload);
            break;
          case MsgConnNotifyAction.onSendMsgError:
            const pdu:any = new SendRes({
              err:ERR.ERR_SYSTEM,
              action:"updateMessageSendFailed",
              payload:JSON.stringify(notify.payload)
            }).pack();
            actions.updateMsg(pdu);
            break;
        }
      }
    }
  })
  await msgConn.connect();
  await msgConn.waitForMsgServerState(MsgClientState.connected);
});

addActionHandler('setAuthPhoneNumber', (global, actions, payload): ActionReturnType => {
  const { phoneNumber } = payload!;

  void callApi('provideAuthPhoneNumber', phoneNumber.replace(/[^\d]/g, ''));

  return {
    ...global,
    authIsLoading: true,
    authError: undefined,
  };
});

addActionHandler('setAuthCode', (global, actions, payload): ActionReturnType => {
  const { code } = payload!;

  void callApi('provideAuthCode', code);

  return {
    ...global,
    authIsLoading: true,
    authError: undefined,
  };
});

addActionHandler('setAuthPassword', async (global, actions, payload): ActionReturnType => {
  const { password,mnemonic } = payload!;
  setGlobal({
    ...global,
    authIsLoading: true,
    authError: undefined,
  })
  let account;
  if(mnemonic){
    const client = MsgConn.getMsgClient()
    if(client){
      client.setAutoConnect(false)
      if(client.isConnect()){
        await client.close();
        await client.waitForMsgServerState(MsgClientState.closed);
      }
      account = Account.getInstance(Account.genAccountId());
      await account.setEntropy(new Mnemonic(mnemonic).toEntropy())
      Account.setCurrentAccountId(account.getAccountId())
      console.log("[change account]",account.getAccountId())
      client.setAccountId(account.getAccountId())
      client.setAutoConnect(true)
      client.connect();
      await client.waitForMsgServerState(MsgClientState.connected)
      account.setMsgConn(client);
      await client.authStep1()
    }
  }else{
    account = Account.getCurrentAccount();
  }

  if(!account){
    return {
      ...global,
      authIsLoading: false,
      authError: "account is not found",
    };
  }
  try {
    const pwd = hashSha256(password)
    const ts = +(new Date());
    const res1 = await account.signMessage(ts.toString());
    const res2 = await account.signMessage(
      ts.toString()+res1!.address,
      pwd
    );
    // console.log({res1,res2})
    const resPre = await account.sendPduWithCallback(new AuthPreLoginReq({
      ts,
      sign1:res1!.sign,
      address1:res1!.address,
      sign2:res2!.sign,
      address2:res2!.address,
    }).pack())
    const authPreLoginRes = AuthPreLoginRes.parseMsg(resPre)
    // console.log({authPreLoginRes})
    if(authPreLoginRes.err !== ERR.NO_ERROR){
      const global = getGlobal();
      setGlobal({
        ...global,
        authIsLoading: false,
        authError: "request uid error",
      })
      return;
    }

    const res21 = await account.signMessage(
      authPreLoginRes.ts.toString() + authPreLoginRes.uid,
      pwd
    );
    // console.log(res21)
    const sessionData = {
      ts:authPreLoginRes.ts,
      uid:authPreLoginRes.uid,
      sign:res21!.sign,
      address:res21!.address,
    }
    await MsgConn.getMsgClient()?.login(sessionData)
    // console.log(sessionData,authLoginRes)
    setGlobal({
      ...getGlobal(),
      authState:"authorizationStateReady",
      authIsLoading: false,
      authError: undefined,
    })
    actions.showNotification({
      message: "登录成功",
      tabId:getCurrentTabId()
    });
  }catch (e){
    console.error(e)
    setGlobal({
      ...getGlobal(),
      authIsLoading: false,
      authError: "系统错误请稍后再试",
    })
    return;
  }
});

addActionHandler('uploadProfilePhoto', async (global, actions, payload): Promise<void> => {
  const {
    file, isFallback, isVideo, videoTs,
  } = payload!;
  // debugger
  const result = await callApi('uploadProfilePhoto', file, isFallback, isVideo, videoTs);
  if (!result) return;
  // debugger
  let res = await MsgConn.getMsgClient()?.sendPduWithCallback(new UploadProfilePhotoReq(result).pack())
  if (!res) return;
  const uploadProfilePhotoRes = UploadProfilePhotoRes.parseMsg(res)
  if(uploadProfilePhotoRes.err !== ERR.NO_ERROR){
    return;
  }
  const user  = JSON.parse(uploadProfilePhotoRes.payload!)
  global = getGlobal();
  global = addUsers(global, buildCollectionByKey([{
    ...global.users.byId[global.currentUserId!],
    ...user
  }], 'id'));
  setGlobal(global);

  // actions.loadFullUser({ userId: global.currentUserId! });
});

addActionHandler('signUp', (global, actions, payload): ActionReturnType => {
  const { firstName, lastName } = payload!;

  void callApi('provideAuthRegistration', { firstName, lastName });

  return {
    ...global,
    authIsLoading: true,
    authError: undefined,
  };
});

addActionHandler('returnToAuthPhoneNumber', (global): ActionReturnType => {
  void callApi('restartAuth');

  return {
    ...global,
    authError: undefined,
  };
});

addActionHandler('goToAuthQrCode', (global): ActionReturnType => {
  void callApi('restartAuthWithQr');

  return {
    ...global,
    authIsLoadingQrCode: true,
    authError: undefined,
  };
});

addActionHandler('saveSession', (global, actions, payload): ActionReturnType => {
  if (global.passcode.isScreenLocked) {
    return;
  }

  const { sessionData } = payload;
  if (sessionData) {
    storeSession(sessionData, global.currentUserId);
  } else {
    clearStoredSession();
  }
});

addActionHandler('signOut', async (global, actions, payload): Promise<void> => {
  setGlobal({
    ...global,
    passcode:{

    },
    currentUserId:undefined,
    chats:{
      ...global.chats,
      byId:{},
      listIds:{
        active:[]
      }
    },
    messages:{
      byChatId:{}
    }
  })
  MsgConn.getMsgClient()?.close()
  const account_id = Account.getCurrentAccountId();
  Account.getInstance(account_id).delSession();
  window.localStorage.removeItem(GLOBAL_STATE_CACHE_KEY)

  // if ('hangUp' in actions) actions.hangUp({ tabId: getCurrentTabId() });
  // if ('leaveGroupCall' in actions) actions.leaveGroupCall({ tabId: getCurrentTabId() });
  //
  // try {
  //   await unsubscribe();
  //   await callApi('destroy');
  //   await forceWebsync(false);
  // } catch (err) {
  //   // Do nothing
  // }
  //
  // actions.reset();
  //
  // if (payload?.forceInitApi) {
  //   actions.initApi();
  // }
  // setGlobal({
  //   ...global,
  //   currentUserId:"",
  //   authState:"authorizationStateWaitRegistration",
  // })
});

addActionHandler('reset', (global, actions): ActionReturnType => {
  clearStoredSession();
  clearEncryptedSession();

  void cacheApi.clear(MEDIA_CACHE_NAME);
  void cacheApi.clear(MEDIA_CACHE_NAME_AVATARS);
  void cacheApi.clear(MEDIA_PROGRESSIVE_CACHE_NAME);
  void cacheApi.clear(CUSTOM_BG_CACHE_NAME);

  const langCachePrefix = LANG_CACHE_NAME.replace(/\d+$/, '');
  const langCacheVersion = (LANG_CACHE_NAME.match(/\d+$/) || [0])[0];
  for (let i = 0; i < langCacheVersion; i++) {
    void cacheApi.clear(`${langCachePrefix}${i === 0 ? '' : i}`);
  }

  void clearLegacySessions();

  updateAppBadge(0);

  actions.initShared({ force: true });
  Object.values(global.byTabId).forEach(({ id: otherTabId, isMasterTab }) => {
    actions.init({ tabId: otherTabId, isMasterTab });
  });
});

addActionHandler('disconnect', (): ActionReturnType => {
  void callApiLocal('disconnect');
});

addActionHandler('destroyConnection', (): ActionReturnType => {
  void callApiLocal('destroy', true, true);
});

addActionHandler('loadNearestCountry', async (global): Promise<void> => {
  if (global.connectionState !== 'connectionStateReady') {
    return;
  }

  const authNearestCountry = await callApi('fetchNearestCountry');

  global = getGlobal();
  global = {
    ...global,
    authNearestCountry,
  };
  setGlobal(global);
});

addActionHandler('setDeviceToken', (global, actions, deviceToken): ActionReturnType => {
  return {
    ...global,
    push: {
      deviceToken,
      subscribedAt: Date.now(),
    },
  };
});

addActionHandler('deleteDeviceToken', (global): ActionReturnType => {
  return {
    ...global,
    push: undefined,
  };
});

addActionHandler('lockScreen', async (global): Promise<void> => {
  const sessionJson = JSON.stringify({ ...loadStoredSession(), userId: global.currentUserId });
  const globalJson = await serializeGlobal(global);

  await encryptSession(sessionJson, globalJson);
  forgetPasscode();
  clearStoredSession();
  updateAppBadge(0);

  global = getGlobal();
  global = updatePasscodeSettings(
    global,
    {
      isScreenLocked: true,
      invalidAttemptsCount: 0,
    },
  );
  setGlobal(global);

  setTimeout(() => {
    global = getGlobal();
    global = clearGlobalForLockScreen(global);
    setGlobal(global);
  }, LOCK_SCREEN_ANIMATION_DURATION_MS);

  try {
    await unsubscribe();
    await callApi('destroy', true);
  } catch (err) {
    // Do nothing
  }
});
