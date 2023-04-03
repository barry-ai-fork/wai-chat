import {Api as GramJs, connection,} from '../../../lib/gramjs';

import {Logger as GramJsLogger} from '../../../lib/gramjs/extensions/index';
import type {TwoFaParams} from '../../../lib/gramjs/client/2fa';

import type {
  ApiInitialArgs,
  ApiMediaFormat,
  ApiOnProgress,
  ApiSessionData,
  ApiUpdateConnectionStateType,
  ApiUpdateMsgClientStateType,
  ApiUser,
  OnApiUpdate,
} from '../../types';

import {APP_VERSION, DEBUG, DEBUG_GRAMJS, UPLOAD_WORKERS,} from '../../../config';
import {onCurrentUserUpdate,} from './auth';
import {updater} from '../updater';
import {setMessageBuilderCurrentUserId} from '../apiBuilders/messages';
import downloadMediaWithClient, {parseMediaUrl} from './media';
import {buildApiUserFromFull} from '../apiBuilders/users';
import localDb, {clearLocalDb} from '../localDb';
import {buildApiPeerId} from '../apiBuilders/peers';
import {addMessageToLocalDb, log} from '../helpers';
import {MsgConnNotify, MsgConnNotifyAction} from "../../../lib/ptp/client/MsgClient";
import MsgClient, {MsgClientState} from "../../../lib/ptp/client/MsgClient";
import {Pdu} from "../../../lib/ptp/protobuf/BaseMsg";
import Account, {ISession} from "../../../worker/share/Account";
import LocalDatabase from "../../../worker/share/db/LocalDatabase";
import {ActionCommands, getActionCommandsName} from "../../../lib/ptp/protobuf/ActionCommands";
import {SendRes} from "../../../lib/ptp/protobuf/PTPMsg";
import message from "../../../components/middle/message/Message";
import {selectChat, selectUser} from "../../../global/selectors";
import {addUsers, addUserStatuses, replaceChats, replaceUsers} from "../../../global/reducers";

const DEFAULT_USER_AGENT = 'Unknown UserAgent';
const DEFAULT_PLATFORM = 'Unknown platform';
const APP_CODE_NAME = 'Z';

GramJsLogger.setLevel(DEBUG_GRAMJS ? 'debug' : 'warn');

let onUpdate: OnApiUpdate;
let client: MsgClient;
let account: Account;
let isConnected = false;
let currentUserId: string | undefined;

const handleSendRes = async (pdu:Pdu)=> {
  const {err, payload, action} = SendRes.parseMsg(pdu)
  const payloadData = JSON.parse(payload)

  if(DEBUG){
    console.log("[handleSendRes]",getActionCommandsName(pdu.getCommandId()),action,payloadData)
  }
  switch (action) {
    case "removeBot":
      onUpdate({
        '@type': 'updateGlobalUpdate',
        data:{
          action,
          payload:{
            chatId:payloadData.chatId
          }
        }
      });
      break
    case "createBot":
    case "loadChats":
      onUpdate({
        '@type': 'updateGlobalUpdate',
        data:{
          action,
        }
      });
      break
    case "clearHistory":
      onUpdate({
        '@type': 'updateGlobalUpdate',
        data:{
          action,
          payload:{
            chatId:payloadData.chatId
          }
        }
      });
      break
    case "updateGlobal":
      onUpdate({
        '@type': 'updateGlobalUpdate',
        data:{
          chats:payloadData.chats,
          users:payloadData.users
        }
      });
      break
    case "updateMessage":
      onUpdate({
        '@type': 'updateMessage',
        chatId: String(payloadData.msg.chatId),
        id: Number(payloadData.msg.id),
        message: {
          ...payloadData.msg
        },
      });
      break
    case "newMessage":
      onUpdate({
        '@type': 'newMessage',
        id: Number(payloadData.msg.id),
        chatId: String(payloadData.msg.chatId),
        message: {
          ...payloadData.msg
        },
      });
      break
    case "updateMessageSendSucceeded":
      onUpdate({
        '@type': 'updateMessageSendSucceeded',
        localId: Number(payloadData.localMsgId),
        chatId: String(payloadData.msg.chatId),
        message: {
          sendingState: undefined,
          ...payloadData.msg
        },
      });
      break
    default:
      //@ts-ignore
      onUpdate({'@type': action, ...payloadData});
      break
  }
}

const handleRcvMsg = async (pdu:Pdu)=>{
  const cmd = pdu.getCommandId();
  switch (cmd) {
    case ActionCommands.CID_SendRes:
      await handleSendRes(pdu)
      break
    default:
      break
  }
}

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
  const {accountId,session,entropy} = payload!;

  client = new MsgClient(accountId);

  const kv = new LocalDatabase();
  kv.init(localDb);
  Account.setKvStore(kv)
  account = Account.getInstance(accountId);
  Account.setCurrentAccount(account);
  account.setMsgConn(client)
  account.setSession(session)
  await account.setEntropy(entropy)

  client.setMsgHandler(async (accountId:number,notifys:MsgConnNotify[])=>{
    if(notifys && notifys.length > 0){
      for (let i = 0; i < notifys.length; i++) {
        const notify = notifys[i];
        switch (notify.action){
          case MsgConnNotifyAction.onConnectionStateChanged:
            const {msgClientState} = notify.payload;
            let connectionState:ApiUpdateConnectionStateType;
            let msgClientState_: ApiUpdateMsgClientStateType
            if(msgClientState === MsgClientState.connected || msgClientState === MsgClientState.waitingLogin || msgClientState === MsgClientState.logged){
              connectionState = "connectionStateReady"
              if(msgClientState === MsgClientState.logged){
                msgClientState_ = "connectionStateLogged"
                const account = Account.getInstance(accountId)
                if(DEBUG){
                  console.log("[connectionStateLogged]",account.getUid(),account.getUserInfo())
                }
                // @ts-ignore
                const currentUser:ApiUser = account.getUserInfo()!;
                onUpdate({
                  '@type': 'updateCurrentUser',
                  currentUser,
                  accountId:accountId,
                  sessionData:account.getSession()
                });
              }else if(msgClientState === MsgClientState.waitingLogin){
                msgClientState_ = "connectionStateWaitingLogin"
              }else{
                msgClientState_ = "connectionStateConnected"
              }
            }else if(msgClientState === MsgClientState.connecting || msgClientState === MsgClientState.closed){
              connectionState = "connectionStateConnecting"
              msgClientState_ = "connectionStateConnecting"
            }else{
              connectionState = "connectionStateBroken";
              msgClientState_ = "connectionStateBroken"
            }

            onUpdate({
              '@type': 'updateMsgClientState',
              msgClientState:msgClientState_,
            });
            onUpdate({
              '@type': 'updateConnectionState',
              connectionState,
            });

            break
          case MsgConnNotifyAction.onData:
            const payload = notify.payload;
            handleRcvMsg(payload).catch(console.error)
            break;
        }
      }
    }
  })

  try {
    if (DEBUG) {
      log('CONNECTING');
      // eslint-disable-next-line no-restricted-globals
      (self as any).invoke = invokeRequest;
    }
    try {
      client.connect()
      await client.waitForMsgServerState(MsgClientState.connected)
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      if (err.message !== 'Disconnect' && err.message !== 'Cannot send requests while disconnected') {
        onUpdate({
          '@type': 'updateConnectionState',
          connectionState: 'connectionStateBroken',
        });
        return;
      }
    }

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('>>> FINISH INIT API');
      log('CONNECTED');
    }


    onUpdate({ '@type': 'updateApiReady' });

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

export async function sendWithCallback(buff:Uint8Array){
  const newPdu = new Pdu(buff)
  newPdu.writeData(newPdu.body(),newPdu.getCommandId(),newPdu.getSeqNum(),newPdu.getReversed())
  const res:Pdu = await Account.getCurrentAccount()?.sendPduWithCallback(newPdu)
  if(!res){
    return;
  }
  return res.getPbData()
}

export async function msgClientLogin(payload:ISession){
  return  await client.login(payload);
}

