import {Api as GramJs, connection, TelegramClient,} from '../../../lib/gramjs';

import {Logger as GramJsLogger} from '../../../lib/gramjs/extensions/index';
import type {TwoFaParams} from '../../../lib/gramjs/client/2fa';

import type {
  AccountSession,
  ApiInitialArgs,
  ApiMediaFormat,
  ApiOnProgress,
  ApiSessionData,
  OnApiUpdate,
} from '../../types';

import {
  APP_VERSION,
  CLOUD_MESSAGE_API,
  CLOUD_MESSAGE_ENABLE,
  DEBUG,
  DEBUG_GRAMJS,
  UPLOAD_WORKERS,
} from '../../../config';
import {onCurrentUserUpdate,} from './auth';
import {updater} from '../updater';
import {setMessageBuilderCurrentUserId} from '../apiBuilders/messages';
import downloadMediaWithClient, {parseMediaUrl} from './media';
import {buildApiUserFromFull} from '../apiBuilders/users';
import localDb, {clearLocalDb} from '../localDb';
import {buildApiPeerId} from '../apiBuilders/peers';
import {addMessageToLocalDb, log} from '../helpers';
import MsgClient from "../../../lib/ptp/client/MsgClient";
import {
  Pdu,
  popByteBuffer, readBytes, readInt16, readInt32,
  toUint8Array,
  wrapByteBuffer,
  writeBytes,
  writeInt16,
  writeInt32
} from "../../../lib/ptp/protobuf/BaseMsg";
import Account, {ISession} from "../../../worker/share/Account";
import LocalDatabase from "../../../worker/share/db/LocalDatabase";
import {getActionCommandsName} from "../../../lib/ptp/protobuf/ActionCommands";
import {CurrentUserInfo, UseLocalDb} from "../../../worker/setting";
import {PbMsg, PbUser} from "../../../lib/ptp/protobuf/PTPCommon";
import {
  SyncFromRemoteReq,
  SyncFromRemoteRes,
  SyncToRemoteReq,
  SyncToRemoteRes
} from "../../../lib/ptp/protobuf/PTPSync";
import {SyncFromRemoteReq_Type, SyncToRemoteReq_Type} from "../../../lib/ptp/protobuf/PTPSync/types";

const DEFAULT_USER_AGENT = 'Unknown UserAgent';
const DEFAULT_PLATFORM = 'Unknown platform';
const APP_CODE_NAME = 'Z';

GramJsLogger.setLevel(DEBUG_GRAMJS ? 'debug' : 'warn');

let onUpdate: OnApiUpdate;
let client: TelegramClient;
export let account: Account;
let isConnected = false;
let currentUserId: string | undefined;
export let accountSession : AccountSession

export async function init(_onUpdate: OnApiUpdate, initialArgs: ApiInitialArgs) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('>>> START INIT API');
  }
  onUpdate = _onUpdate;
  const {
    userAgent, platform, sessionData, isTest, isMovSupported, isWebmSupported, maxBufferSize, webAuthToken, dcId,
    mockScenario,payload,
  } = initialArgs;
  if(DEBUG){
    console.log("[initialArgs]",{
      deviceModel: navigator.userAgent || userAgent || DEFAULT_USER_AGENT,
      systemVersion: platform || DEFAULT_PLATFORM,
      appVersion: `${APP_VERSION} ${APP_CODE_NAME}`,
      useWSS: true,
    })
  }
  const {accountId,session,currentAccountAddress,entropy} = payload!;

  const kv = new LocalDatabase();
  kv.init(localDb);
  Account.setKvStore(kv)
  account = Account.getInstance(accountId);
  Account.setCurrentAccount(account);
  await account.setEntropy(entropy)
  await setSession(payload!)
  try {
    if (DEBUG) {
      log('CONNECTING');
      // eslint-disable-next-line no-restricted-globals
      (self as any).invoke = invokeRequest;
    }

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('>>> FINISH INIT API');
      log('CONNECTED');
    }

    onUpdate({ '@type': 'updateApiReady' });

    if(UseLocalDb){
      if((CLOUD_MESSAGE_ENABLE && currentAccountAddress) || (!session)){
        onUpdate({
          '@type': 'updateAuthorizationState',
          authorizationState: "authorizationStateReady",
        });
      }

      // @ts-ignore
      onUpdate({'@type': 'updateCurrentUser',currentUser: CurrentUserInfo});

      onUpdate({
        '@type': 'updateMsgClientState',
        msgClientState:"connectionStateLogged",
      });
      onUpdate({
        '@type': 'updateConnectionState',
        connectionState:"connectionStateReady",
      });

    }
    // void fetchCurrentUser();
  } catch (err) {
    if (DEBUG) {
      log('CONNECTING ERROR', err);
    }
    throw err;
  }

  //
  // const session = new sessions.CallbackSession(sessionData, onSessionUpdate);
  //
  // // eslint-disable-next-line no-restricted-globals
  // (self as any).isMovSupported = isMovSupported;
  // // Hacky way to update this set inside GramJS worker
  // if (isMovSupported) SUPPORTED_VIDEO_CONTENT_TYPES.add(VIDEO_MOV_TYPE);
  // // eslint-disable-next-line no-restricted-globals
  // (self as any).isWebmSupported = isWebmSupported;
  // // eslint-disable-next-line no-restricted-globals
  // (self as any).maxBufferSize = maxBufferSize;

  // client = new TelegramClient(
  //   session,
  //   process.env.TELEGRAM_T_API_ID,
  //   process.env.TELEGRAM_T_API_HASH,
  //   {
  //     deviceModel: navigator.userAgent || userAgent || DEFAULT_USER_AGENT,
  //     systemVersion: platform || DEFAULT_PLATFORM,
  //     appVersion: `${APP_VERSION} ${APP_CODE_NAME}`,
  //     useWSS: true,
  //     additionalDcsDisabled: IS_TEST,
  //     testServers: isTest,
  //     dcId,
  //   } as any,
  // );
  //
  // client.addEventHandler(handleGramJsUpdate, gramJsUpdateEventBuilder);
  // client.addEventHandler(updater, gramJsUpdateEventBuilder);
  //
  // try {
  //   if (DEBUG) {
  //     log('CONNECTING');
  //
  //     // eslint-disable-next-line no-restricted-globals
  //     (self as any).invoke = invokeRequest;
  //     // eslint-disable-next-line no-restricted-globals
  //     (self as any).GramJs = GramJs;
  //   }
  //
  //   try {
  //     await client.start({
  //       phoneNumber: onRequestPhoneNumber,
  //       phoneCode: onRequestCode,
  //       password: onRequestPassword,
  //       firstAndLastNames: onRequestRegistration,
  //       qrCode: onRequestQrCode,
  //       onError: onAuthError,
  //       initialMethod: platform === 'iOS' || platform === 'Android' ? 'phoneNumber' : 'qrCode',
  //       shouldThrowIfUnauthorized: Boolean(sessionData),
  //       webAuthToken,
  //       webAuthTokenFailed: onWebAuthTokenFailed,
  //       mockScenario,
  //     });
  //   } catch (err: any) {
  //     // eslint-disable-next-line no-console
  //     console.error(err);
  //
  //     if (err.message !== 'Disconnect' && err.message !== 'Cannot send requests while disconnected') {
  //       onUpdate({
  //         '@type': 'updateConnectionState',
  //         connectionState: 'connectionStateBroken',
  //       });
  //
  //       return;
  //     }
  //   }
  //
  //   if (DEBUG) {
  //     // eslint-disable-next-line no-console
  //     console.log('>>> FINISH INIT API');
  //     log('CONNECTED');
  //   }
  //
  //   onAuthReady();
  //   onSessionUpdate(session.getSessionData());
  //   onUpdate({ '@type': 'updateApiReady' });
  //
  //   void fetchCurrentUser();
  // } catch (err) {
  //   if (DEBUG) {
  //     log('CONNECTING ERROR', err);
  //   }
  //
  //   throw err;
  // }
}

export function setIsPremium({ isPremium }: { isPremium: boolean }) {
  // client.setIsPremium(isPremium);
}

export async function destroy(noLogOut = false, noClearLocalDb = false) {
  // if (!noLogOut) {
  //   await invokeRequest(new GramJs.auth.LogOut());
  // }
  await Account.getCurrentAccount()?.delSession()
  if (!noClearLocalDb) clearLocalDb();

  await client.destroy();
}

export async function disconnect() {
  await client.disconnect();
}

export function getClient() {
  return client;

}

function onSessionUpdate(sessionData: ApiSessionData) {
  onUpdate({
    '@type': 'updateSession',
    sessionData,
  });
}

function handleGramJsUpdate(update: any) {
  if (update instanceof connection.UpdateConnectionState) {
    isConnected = update.state === connection.UpdateConnectionState.connected;
  } else if (update instanceof GramJs.UpdatesTooLong) {
    void handleTerminatedSession();
  } else if (update instanceof GramJs.UpdateConfig) {
    // eslint-disable-next-line no-underscore-dangle
    const currentUser = (update as GramJs.UpdateConfig & { _entities?: (GramJs.TypeUser | GramJs.TypeChat)[] })
      ._entities
      ?.find((entity) => entity instanceof GramJs.User && buildApiPeerId(entity.id, 'user') === currentUserId);
    if (!(currentUser instanceof GramJs.User)) return;

    setIsPremium({ isPremium: Boolean(currentUser.premium) });
  }
}

export async function invokeRequest<T extends GramJs.AnyRequest>(
  request: T,
  shouldReturnTrue: true,
  shouldThrow?: boolean,
  shouldIgnoreUpdates?: undefined,
  dcId?: number,
  shouldIgnoreErrors?: boolean,
): Promise<true | undefined>;

export async function invokeRequest<T extends GramJs.AnyRequest>(
  request: T,
  shouldReturnTrue?: boolean,
  shouldThrow?: boolean,
  shouldIgnoreUpdates?: boolean,
  dcId?: number,
  shouldIgnoreErrors?: boolean,
): Promise<T['__response'] | undefined>;

export async function invokeRequest<T extends GramJs.AnyRequest>(
  request: T,
  shouldReturnTrue = false,
  shouldThrow = false,
  shouldIgnoreUpdates = false,
  dcId?: number,
  shouldIgnoreErrors = false,
) {
  if (!isConnected) {
    if (DEBUG) {
      log('INVOKE ERROR', request.className, 'Client is not connected');
    }

    return undefined;
  }

  try {
    if (DEBUG) {
      log('INVOKE', request.className);
    }

    const result = await client.invoke(request, dcId);

    if (DEBUG) {
      log('RESPONSE', request.className, result);
    }

    if (!shouldIgnoreUpdates) {
      handleUpdatesFromRequest(request, result);
    }

    return shouldReturnTrue ? result && true : result;
  } catch (err: any) {
    if (shouldIgnoreErrors) return undefined;
    if (DEBUG) {
      log('INVOKE ERROR', request.className);
      // eslint-disable-next-line no-console
      console.debug('invokeRequest failed with payload', request);
      // eslint-disable-next-line no-console
      console.error(err);
    }

    if (shouldThrow) {
      throw err;
    }

    dispatchErrorUpdate(err, request);

    return undefined;
  }
}

function handleUpdatesFromRequest<T extends GramJs.AnyRequest>(request: T, result: T['__response']) {
  let manyUpdates;
  let singleUpdate;

  if (result instanceof GramJs.UpdatesCombined || result instanceof GramJs.Updates) {
    manyUpdates = result;
  } else if (typeof result === 'object' && 'updates' in result && (
    result.updates instanceof GramJs.Updates || result.updates instanceof GramJs.UpdatesCombined
  )) {
    manyUpdates = result.updates;
  } else if (
    result instanceof GramJs.UpdateShortMessage
    || result instanceof GramJs.UpdateShortChatMessage
    || result instanceof GramJs.UpdateShort
    || result instanceof GramJs.UpdateShortSentMessage
  ) {
    singleUpdate = result;
  }

  if (manyUpdates) {
    injectUpdateEntities(manyUpdates);

    manyUpdates.updates.forEach((update) => {
      updater(update, request);
    });
  } else if (singleUpdate) {
    updater(singleUpdate, request);
  }
}

export async function downloadMedia(
  args: { url: string; mediaFormat: ApiMediaFormat; start?: number; end?: number; isHtmlAllowed?: boolean },
  onProgress?: ApiOnProgress,
) {
  try {
    return (await downloadMediaWithClient(args, client, isConnected, onProgress));
  } catch (err: any) {
    if (err.message.startsWith('FILE_REFERENCE')) {
      const isFileReferenceRepaired = await repairFileReference({ url: args.url });
      if (isFileReferenceRepaired) {
        return downloadMediaWithClient(args, client, isConnected, onProgress);
      }

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.error('Failed to repair file reference', args.url);
      }
    }

    throw err;
  }
}

export function uploadFile(file: File, onProgress?: ApiOnProgress) {
  return client.uploadFile({ file, onProgress, workers: UPLOAD_WORKERS });
}

export function updateTwoFaSettings(params: TwoFaParams) {
  return client.updateTwoFaSettings(params);
}

export function getTmpPassword(currentPassword: string, ttl?: number) {
  return client.getTmpPassword(currentPassword, ttl);
}

export async function fetchCurrentUser() {
  const userFull = await invokeRequest(new GramJs.users.GetFullUser({
    id: new GramJs.InputUserSelf(),
  }));

  if (!userFull || !(userFull.users[0] instanceof GramJs.User)) {
    return;
  }

  const user = userFull.users[0];

  if (user.photo instanceof GramJs.Photo) {
    localDb.photos[user.photo.id.toString()] = user.photo;
  }
  localDb.users[buildApiPeerId(user.id, 'user')] = user;
  const currentUser = buildApiUserFromFull(userFull);

  setMessageBuilderCurrentUserId(currentUser.id);
  onCurrentUserUpdate(currentUser);

  currentUserId = currentUser.id;
  setIsPremium({ isPremium: Boolean(currentUser.isPremium) });
}

export function dispatchErrorUpdate<T extends GramJs.AnyRequest>(err: Error, request: T) {
  const isSlowMode = err.message.startsWith('A wait of') && (
    request instanceof GramJs.messages.SendMessage
    || request instanceof GramJs.messages.SendMedia
    || request instanceof GramJs.messages.SendMultiMedia
  );

  const { message } = err;

  onUpdate({
    '@type': 'error',
    error: {
      message,
      isSlowMode,
      hasErrorKey: true,
    },
  });
}

function injectUpdateEntities(result: GramJs.Updates | GramJs.UpdatesCombined) {
  const entities = [...result.users, ...result.chats];

  result.updates.forEach((update) => {
    if (entities) {
      // eslint-disable-next-line no-underscore-dangle
      (update as any)._entities = entities;
    }
  });
}

async function handleTerminatedSession() {
  try {
    await invokeRequest(new GramJs.users.GetFullUser({
      id: new GramJs.InputUserSelf(),
    }), undefined, true);
  } catch (err: any) {
    if (err.message === 'AUTH_KEY_UNREGISTERED') {
      onUpdate({
        '@type': 'updateConnectionState',
        connectionState: 'connectionStateBroken',
      });
    }
  }
}

export async function repairFileReference({
  url,
}: {
  url: string;
}) {
  const parsed = parseMediaUrl(url);

  if (!parsed) return undefined;

  const {
    entityType, entityId, mediaMatchType,
  } = parsed;

  if (mediaMatchType === 'file') {
    return false;
  }

  if (entityType === 'msg') {
    const entity = localDb.messages[entityId]!;
    const messageId = entity.id;

    const peer = 'channelId' in entity.peerId ? new GramJs.InputChannel({
      channelId: entity.peerId.channelId,
      accessHash: (localDb.chats[buildApiPeerId(entity.peerId.channelId, 'channel')] as GramJs.Channel).accessHash!,
    }) : undefined;
    const result = await invokeRequest(
      peer
        ? new GramJs.channels.GetMessages({
          channel: peer,
          id: [new GramJs.InputMessageID({ id: messageId })],
        })
        : new GramJs.messages.GetMessages({
          id: [new GramJs.InputMessageID({ id: messageId })],
        }),
    );

    if (!result || result instanceof GramJs.messages.MessagesNotModified) return false;

    const message = result.messages[0];
    if (message instanceof GramJs.MessageEmpty) return false;
    addMessageToLocalDb(message);
    return true;
  }
  return false;
}

export async function invokeSyncToRemoteReq(data:SyncToRemoteReq_Type){
  if(data.users && data.users.length > 0){
    for (let i = 0; i < data.users.length; i++) {
      let {user,time} = data.users[i];
      time = Math.ceil(time/1000)
      let buf = Buffer.from(new PbUser(user).pack().getPbData())
      const password = "WAI"+time.toString();
      const cipher = await account.encryptData(buf,password)
      const bb = popByteBuffer();
      writeInt32(bb, cipher?.length + 4 + 4 + 4 + 2);
      writeInt16(bb, 1);
      writeInt32(bb, time);
      writeInt32(bb, 0);
      writeBytes(bb, cipher);
      let buf1 = Buffer.from(toUint8Array(bb))
      // console.log("plain",buf1.toString("hex"))
      // console.log("cipher",cipher.toString("hex"))
      // console.log("encode",buf1.toString("hex"))
      data.users[i] = {
        ...data.users[i],
        time,
        buf:buf1
      }
      data.users[i].user = undefined
    }
  }

  if(data.messages && data.messages.length > 0){
    for (let i = 0; i < data.messages.length; i++) {
      let {message,time} = data.messages[i];

      time = Math.ceil(time/1000)
      let buf = Buffer.from(new PbMsg(message!).pack().getPbData())
      const password = "WAI"+time.toString();
      const cipher = await account.encryptData(buf,password)
      const bb = popByteBuffer();
      writeInt32(bb, cipher?.length + 4 + 4 + 4 + 2);
      writeInt16(bb, 1);
      writeInt32(bb, time);
      writeInt32(bb, 0);
      writeBytes(bb, cipher);
      let buf1 = Buffer.from(toUint8Array(bb))

      data.messages[i] = {
        ...data.messages[i],
        buf:buf1,
      }
      data.messages[i].message = undefined
    }
  }

  if(DEBUG){
    console.log("invokeSyncToRemoteReq",data)
  }
  const res = await sendWithCallback(Buffer.from(new SyncToRemoteReq(data).pack().getPbData()));
  if(!res){
    return
  }
  try {
    return SyncToRemoteRes.parseMsg(new Pdu(res))
  }catch (e){
    console.error(e)
    return
  }
}

export async function invokeSyncFromRemote(data:SyncFromRemoteReq_Type){
  if(accountSession.currentAccountAddress && accountSession.session){
    const res = await sendWithCallback(Buffer.from(new SyncFromRemoteReq(data).pack().getPbData()))
    if(!res){
      return
    }
    const result = SyncFromRemoteRes.parseMsg(new Pdu(Buffer.from(res)))
    console.log("[SyncFromRemoteRes]",result)
    if(result.users && result.users.length > 0){
      for (let i = 0; i < result.users.length; i++) {
        let {buf} = result.users[i];
        const bbDecode = wrapByteBuffer(Buffer.from(buf!))
        const len = readInt32(bbDecode);
        const encrypt = readInt16(bbDecode) === 1;
        const time = readInt32(bbDecode);
        const reverse = readInt32(bbDecode);
        let buf2 = readBytes(bbDecode,len - 14);
        const password = "WAI"+time.toString();
        // console.log("encode",Buffer.from(buf!).toString("hex"))
        // console.log("cipher",Buffer.from(buf2).toString("hex"))

        buf = await account.decryptData(Buffer.from(buf2),password)
        result.users[i] = {
          ...result.users[i],
          time,
          user: PbUser.parseMsg(new Pdu(Buffer.from(buf)))
        }
        result.users[i].buf = undefined
      }
    }
    if(result.messages && result.messages.length > 0){
      for (let i = 0; i < result.messages.length; i++) {
        let {buf,chatId} = result.messages[i];
        const bbDecode = wrapByteBuffer(Buffer.from(buf!))
        const len = readInt32(bbDecode);
        const encrypt = readInt16(bbDecode) === 1;
        const time = readInt32(bbDecode);
        const reverse = readInt32(bbDecode);
        let buf2 = readBytes(bbDecode,len - 14);
        const password = "WAI"+time.toString();
        // console.log("encode",Buffer.from(buf!).toString("hex"))
        // console.log("cipher",Buffer.from(buf2).toString("hex"))

        buf = await account.decryptData(Buffer.from(buf2),password)
        result.messages[i] = {
          ...result.messages[i],
          chatId,
          time,
          message: PbMsg.parseMsg(new Pdu(Buffer.from(buf)))
        }
        result.messages[i].buf = undefined
      }
    }


    return result
  }else{
    return
  }
}
export async function sendWithCallback(buff:Uint8Array){
  const newPdu = new Pdu(buff)

  if(CLOUD_MESSAGE_ENABLE){
    if(!accountSession.session){
      return
    }
    if(!accountSession.currentAccountAddress){
      return
    }
    if(DEBUG){
      console.log("sendWithCallback",{accountSession,CLOUD_MESSAGE_ENABLE,cmd:getActionCommandsName(newPdu.getCommandId())})
    }
    const res = await fetch(`${CLOUD_MESSAGE_API}/proto`, {
      method: "POST",
      body: Buffer.from(newPdu.getPbData()),
      headers:{
        Authorization: `Bearer ${accountSession.session}`,
      }
    });
    if(!res || res.status !== 200){
      return;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }else {
    const res:Pdu = await Account.getCurrentAccount()?.sendPduWithCallback(newPdu)
    if(!res){
      return;
    }
    return res.getPbData()
  }
}

export async function msgClientLogin(payload:ISession){
  return  await client.login(payload);
}

export async function setSession(payload:AccountSession){
  accountSession = {
    ...accountSession,
    ...payload
  };
}
