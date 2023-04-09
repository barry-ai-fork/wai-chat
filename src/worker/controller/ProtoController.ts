import {
	Pdu,
} from '../../lib/ptp/protobuf/BaseMsg';
import { ActionCommands } from '../../lib/ptp/protobuf/ActionCommands';
import { Download, Upload } from '../share/service/File';
import { SyncMessagesRes } from '../../lib/ptp/protobuf/PTPMsg';
import {
	ERR, MessageStoreRow_Type, PbChatFolder_Type,
	UserMessageStoreData_Type,
	UserStoreData_Type, UserStoreRow_Type,
} from '../../lib/ptp/protobuf/PTPCommon/types';
import Logger from '../share/cls/Logger';
import {SyncFromRemoteReq, SyncFromRemoteRes, SyncToRemoteReq} from '../../lib/ptp/protobuf/PTPSync';
import {
	UserMessageStoreData,
	UserStoreData,
} from '../../lib/ptp/protobuf/PTPCommon';
import Account from '../share/Account';
import {ENV, kv} from '../env';
import { genUserId } from '../share/service/User';
import {GenUserIdReq, GenUserIdRes} from "../../lib/ptp/protobuf/PTPUser";
import WaiOpenAPIRoute from "../share/cls/WaiOpenAPIRoute";


const handleGenUserIdReq = async (authUserId: number, pdu: Pdu) => {
	const res = GenUserIdReq.parseMsg(pdu);
	Logger.debug('[handleGenUserIdReq]', res);
	const userIdStr = await kv.get('W_U_INCR_' + authUserId,true);
	let userId = parseInt(ENV.USER_ID_START);
	if(userIdStr){
		userId = parseInt(userIdStr) + 1
	}else{
		userId += 1
	}
	console.log("===============>>>>",userId)
	await kv.put('W_U_INCR_' + authUserId,userId.toString());
  return WaiOpenAPIRoute.responsePdu(
    new GenUserIdRes({
      userId,
      err: ERR.NO_ERROR,
    })
    .pack()
  )
}

const handleSyncFromRemoteReq = async (authUserId: number, pdu: Pdu) => {
	const res = SyncFromRemoteReq.parseMsg(pdu);
	let { userIds,messageIds,chatId } = res;
	Logger.debug('[handleSyncFromRemoteReq]', res);
	const userDataStr = await kv.get('W_U_D_' + authUserId);
	let userData: UserStoreData_Type = { authUserId, time: +new Date() };
	let chatIds = []
	let chatsDeleted = []
	if(messageIds === undefined){
		messageIds = []
	}
	let folderIds: number[] | undefined = []
	let chatFolders: PbChatFolder_Type[] | undefined = []
	const users:UserStoreRow_Type[] = []
	const messages:MessageStoreRow_Type[] = []
	if (messageIds .length === 0 && !userIds && userDataStr) {
		userData = UserStoreData.parseMsg(new Pdu(Buffer.from(userDataStr, 'hex')));
		Logger.debug('[get userData]', userData);
		chatIds = userData.chats?.map(String)
		folderIds = userData.folderIds
		chatsDeleted = userData.chatsDeleted
		chatFolders = userData.chatFolders
	}
	if(userIds){
		for (let i = 0; i < userIds.length; i++) {
			const userId = userIds[i]
			const str = await kv.get(
				'W_U_I_' + authUserId + '_' + userId,
			);
			if(str){
				users.push({
					userId,
					buf:Buffer.from(str,"hex")
				})
			}
		}

	}
	if(chatId){
		if(messageIds.length > 0){
			for (let i = 0; i < messageIds.length; i++) {
				const messageId = messageIds[i]
				const msgStr = await kv.get(
					'W_M_I_' + authUserId + '_' + chatId + '_' + messageId
				);
				if(msgStr){
					messages.push({
						messageId,
						chatId,
						buf:Buffer.from(msgStr,"hex")
					})
				}
			}
			messageIds = []
		}else{
			const userChatMessageDataStr = await kv.get(
				`W_U_C_M_${authUserId}_${chatId}`
			);
			if(userChatMessageDataStr){
				const userMessageStoreDataRes = UserMessageStoreData.parseMsg(new Pdu(Buffer.from(userChatMessageDataStr,'hex')))
				messageIds =userMessageStoreDataRes.messageIds?.sort((a,b)=>b-a)
			}
		}

	}

  return WaiOpenAPIRoute.responsePdu(
    new SyncFromRemoteRes({
      users,
      messageIds,
      messages,
      chatIds,
      chatsDeleted,
      folderIds,
      chatFolders,
      err: ERR.NO_ERROR,
    }).pack()
  )
}

const handleSyncToRemoteReq = async (authUserId: number, pdu: Pdu) => {
	const res = SyncToRemoteReq.parseMsg(pdu);
	Logger.debug('[handleSyncToRemoteReq]', res);

	const userDataStr = await kv.get('W_U_D_' + authUserId);
	let userData: UserStoreData_Type = { authUserId, time: +new Date() };
	if (userDataStr) {
		userData = UserStoreData.parseMsg(new Pdu(Buffer.from(userDataStr, 'hex')));
		Logger.debug('[get userData]', userData);
	}
	let changed = false;
	const chatMessages: Record<string, { messageId: number; isDelete: boolean }[]> = {};
	if (res.users && res.users.length > 0) {
		for (let i = 0; i < res.users?.length; i++) {
			const { buf, userId, encrypt,time } = res.users[i];
			if (!userData.chats) {
				userData.chats = [];
			}
			if (!userData.chats?.includes(Number(userId))) {
				changed = true;
				userData.chats?.push(Number(userId));
			}
			await kv.put(
				'W_U_I_' + authUserId + '_' + userId,
				Buffer.from(buf!).toString("hex")
			);
		}
	}

	if (res.messages && res.messages.length > 0) {
		for (let i = 0; i < res.messages?.length; i++) {
			const { buf,encrypt, messageId, chatId, time } = res.messages[i];
			if (!chatMessages[chatId]) {
				chatMessages[chatId] = [];
			}
			chatMessages[chatId].push({
				messageId,
				isDelete: false,
			});
			await kv.put(
				'W_M_I_' + authUserId + '_' + chatId + '_' + messageId,
				Buffer.from(buf!).toString("hex")
			);
		}
	}

	if (res.deleteUserIds && res.deleteUserIds.length > 0) {
		for (let i = 0; i < res.deleteUserIds?.length; i++) {
			const userId = res.deleteUserIds[i];
			if (!userData.chats) {
				userData.chats = [];
			}
			if (!userData.chatsDeleted) {
				userData.chatsDeleted = [];
			}

			if (!userData.chatsDeleted?.includes(Number(userId))) {
				changed = true;
				userData.chatsDeleted.push(Number(userId));
			}
			if (userData.chats?.includes(Number(userId))) {
				changed = true;
				userData.chats = userData.chats?.filter(id => id !== Number(userId));
			}
			await kv.delete('W_U_I_' + authUserId + '_' + userId);
		}
	}

	if (res.deleteMessageIds && res.deleteMessageIds.length > 0) {
		for (let i = 0; i < res.deleteMessageIds?.length; i++) {
			const chatMessageId = res.deleteMessageIds[i];
			const [chatId, messageId] = chatMessageId.split('_');
			if (!chatMessages[chatId]) {
				chatMessages[chatId] = [];
			}
			chatMessages[chatId].push({
				messageId: Number(messageId),
				isDelete: true,
			});
			await kv.delete('W_M_I_' + authUserId + '_' + chatMessageId);
		}
	}

	if (res.chatFolders && res.chatFolders.length > 0) {
		userData.chatFolders = res.chatFolders;
		changed = true;
	}

	if (res.folderIds && res.folderIds.length > 0) {
		userData.folderIds = res.folderIds;
		if(res.folderIds.indexOf(0) === -1){
			userData.folderIds.unshift(0)
		}
		changed = true;
	}

	if (Object.keys(chatMessages).length > 0) {
		for (let i = 0; i < Object.keys(chatMessages).length; i++) {
			const chatId = Object.keys(chatMessages)[i];
			let userChatMessageDataStr = await kv.get(`W_U_C_M_${authUserId}_${chatId}`);
			let userChatMessageData: UserMessageStoreData_Type = { authUserId, time: +new Date() };
			if (userChatMessageDataStr) {
				userChatMessageData = UserMessageStoreData.parseMsg(
					new Pdu(Buffer.from(userChatMessageDataStr, 'hex'))
				);
			}
			Logger.debug('[get userChatMessageData]', chatId,userChatMessageData);
			let userChatMessageDataChanged = false;
			const messages = chatMessages[chatId];
			for (let j = 0; j < messages.length; j++) {
				const { messageId, isDelete } = messages[i];
				if (!userChatMessageData.messageIds) {
					userChatMessageData.messageIds = [];
				}
				if (isDelete && userChatMessageData.messageIds.includes(messageId)) {
					userChatMessageData.messageIds = userChatMessageData.messageIds.filter(
						id => id !== messageId
					);
					userChatMessageDataChanged = true;
				}
				if (!isDelete && !userChatMessageData.messageIds.includes(messageId)) {
					userChatMessageData.messageIds.push(messageId);
					userChatMessageDataChanged = true;
				}
			}
			if (userChatMessageDataChanged) {
				Logger.debug('[save userChatMessageData]',chatId, userChatMessageData);
				await kv.put(
					`W_U_C_M_${authUserId}_${chatId}`,
					Buffer.from(
						new UserMessageStoreData(userChatMessageData).pack().getPbData()
					).toString('hex')
				);
			}
		}
	}

	if (changed) {
		Logger.debug('[save userData]', userData);
		await kv.put(
			'W_U_D_' + authUserId,
			Buffer.from(new UserStoreData(userData).pack().getPbData()).toString('hex')
		);
	}
  return WaiOpenAPIRoute.responsePdu(
    new SyncMessagesRes({
      err: ERR.NO_ERROR,
    }).pack()
  )
};
export default class ProtoController extends WaiOpenAPIRoute{
  static schema = {
    tags: ['Proto'],
    parameters: {

    },
    responses: {
      '200': {
        schema: {},
      },
    },
  };

  async handle(request: Request, data: Record<string, any>) {
    return await this.dispatch(request)
  }

	async dispatch(request: Request) {
		try {
			const arrayBuffer = await request.arrayBuffer();
			let pdu = new Pdu(Buffer.from(arrayBuffer));
			switch (pdu.getCommandId()) {
				case ActionCommands.CID_DownloadReq:
					return Download(pdu);
				default:
					break;
			}

			const auth = request.headers.get('Authorization');
			if (!auth) {
        return WaiOpenAPIRoute.responseError("not auth",401)
			}
			const token = auth.replace('Bearer ', '');
			if (token.indexOf('_') === -1) {
        return WaiOpenAPIRoute.responseError("not auth",401)
			}
			const [sign, ts] = token.split('_');
			const account = new Account(1);
			const { address } = account.recoverAddressAndPubKey(
				Buffer.from(sign, 'hex'),
				ts.toString()
			);
			if (!address) {
        return WaiOpenAPIRoute.responseError("not auth",401)
			}
			Account.setKvStore(kv);
			let authUserId = await account.getUidFromCacheByAddress(address);
			if (!authUserId) {
				authUserId = await genUserId();
				await account.saveUidFromCacheByAddress(address, authUserId);
			}
			Logger.debug('[Proto]', authUserId, address);

			switch (pdu.getCommandId()) {
				case ActionCommands.CID_GenUserIdReq:
					return handleGenUserIdReq(Number(authUserId), pdu);
				case ActionCommands.CID_SyncFromRemoteReq:
					return handleSyncFromRemoteReq(Number(authUserId), pdu);
				case ActionCommands.CID_SyncToRemoteReq:
					return handleSyncToRemoteReq(Number(authUserId), pdu);
				case ActionCommands.CID_UploadReq:
					return Upload(pdu);
				default:
					break;
			}
		} catch (e) {
			console.error(e.stack);
			return WaiOpenAPIRoute.responseError(ENV.IS_PROD ? "System Error":e.stack.split("\n"))
		}
	}
}
