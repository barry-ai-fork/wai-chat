import {addActionHandler, getGlobal, setGlobal,} from '../../index';

import {callApi, callApiLocal, initApi} from '../../../api/gramjs';

import {
  CUSTOM_BG_CACHE_NAME,
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
  addUsers,
  addUserStatuses,
  clearGlobalForLockScreen,
  replaceChats,
  replaceUsers,
  updatePasscodeSettings
} from '../../reducers';
import {clearEncryptedSession, encryptSession, forgetPasscode} from '../../../util/passcode';
import {serializeGlobal} from '../../cache';
import {parseInitialLocationHash} from '../../../util/routing';
import type {ActionReturnType} from '../../types';
import {buildCollectionByKey} from '../../../util/iteratees';
import parseMessageInput from "../../../util/parseMessageInput";
import Account from "../../../worker/share/Account";
import LocalStorage from "../../../worker/share/db/LocalStorage";
import {AuthPreLoginReq, AuthPreLoginRes} from "../../../lib/ptp/protobuf/PTPAuth";
import {ERR} from "../../../lib/ptp/protobuf/PTPCommon/types";
import Mnemonic from "../../../lib/ptp/wallet/Mnemonic";
import {hashSha256} from "../../../worker/share/utils/helpers";
import {selectChat, selectUser} from "../../selectors";
import {Pdu} from "../../../lib/ptp/protobuf/BaseMsg";
import {ApiUpdateMsgClientStateType} from "../../../api/types";

addActionHandler('updateGlobal', (global,action,payload): ActionReturnType => {
  return {
    ...global,
    ...payload,
  };
});

addActionHandler('updateMsg', (global,actions,payload:any): ActionReturnType => {

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
  Account.setKvStore(new LocalStorage())
  const accountId = Account.getCurrentAccountId();
  let account = Account.getInstance(accountId);
  const session = global.session;
  const currentAccountAddress = global.currentAccountAddress

  const entropy = await account.getEntropy();
  void initApi(actions.apiUpdate, {
    payload:{
      entropy,
      session,
      currentAccountAddress,
      accountId
    },
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
  const {session,currentAccountAddress} = global
  if(mnemonic){
    const account = Account.getInstance(Account.genAccountId());
    await account.setEntropy(new Mnemonic(mnemonic).toEntropy())
    Account.setCurrentAccountId(account.getAccountId())
    console.log("[change account]",account.getAccountId())
    const pwd = hashSha256(password)
    const ts = +(new Date());
    const {address,sign} = await account.signMessage(ts.toString(),pwd);
    global = getGlobal();
    setGlobal({
      ...global,
      currentAccountAddress:address,
      session:sign.toString("hex") + "_" +ts.toString(),
      authState:"authorizationStateReady",
      authIsLoading: false,
      authError: undefined,
    })
    await callApi("setSession",{
      currentAccountAddress:address,
      session:sign.toString("hex") + "_" +ts.toString(),
      accountId:account.getAccountId()
    })
    actions.loadAllChats({listType:'active'});
  }else{
    const account = Account.getCurrentAccount()!;
    if(session){
      if(!currentAccountAddress){
        const address = await account.verifySession(session!,password);
        global = getGlobal();
        if(!address){
          setGlobal({
            ...global,
            authIsLoading: false,
            authError: "密码不正确"
          })
        }else{
          setGlobal({
            ...global,
            currentAccountAddress:address,
            authState:"authorizationStateReady",
            authIsLoading: false,
            authError: undefined,
          })

          await callApi("setSession",{
            currentAccountAddress:address,
            accountId:account.getAccountId()
          })

          actions.loadAllChats({listType:'active'});
        }
      }
    }else{
      const pwd = hashSha256(password)
      const ts = +(new Date());
      const {address,sign} = await account.signMessage(ts.toString(),pwd);

      global = getGlobal();
      setGlobal({
        ...global,
        currentAccountAddress:address,
        session:sign.toString("hex") + "_" +ts.toString(),
        authState:"authorizationStateReady",
        authIsLoading: false,
        authError: undefined,
      })

      await callApi("setSession",{
        currentAccountAddress:address,
        session:sign.toString("hex") + "_" +ts.toString(),
        accountId:account.getAccountId()
      })
      actions.loadAllChats({listType:'active'});
    }
  }

});

addActionHandler('uploadProfilePhoto', async (global, actions, payload): Promise<void> => {
  const {
    file, isFallback, isVideo, videoTs,
  } = payload!;
  const res = await callApi('uploadProfilePhoto', file, isFallback, isVideo, videoTs);
  if (!res) return;

  global = getGlobal();
  global = addUsers(global, buildCollectionByKey([{
    ...global.users.byId[global.currentUserId!],
    ...res
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
    currentAccountAddress:"",
    isLoggingOut:true,
    passcode:{},
    chats:{
      ...global.chats,
      listIds:{
        ...global.chats.listIds,
        active:[]
      }
    },
  })
  try {
    await unsubscribe();
  } catch (err) {
    // Do nothing
  }

  if (payload?.forceInitApi) {
    actions.initApi();
  }

  global = getGlobal();
  setGlobal({
    ...global,
    authState:"authorizationStateWaitPassword",
    isLoggingOut:false,
  })
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
