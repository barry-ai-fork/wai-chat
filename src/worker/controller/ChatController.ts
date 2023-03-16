import {getUser, getUserFromCache, getUsers} from "./UserController";
import {stringToBuffer} from "../helpers/buffer";
import {ENV} from "../helpers/env";

export async function getChat(user_id){
  const user = await getUser(user_id);
  return {
    "id": user_id,
    "type": "chatTypePrivate",
    "title": user.firstName,
    "lastReadOutboxMessageId": 0,
    "lastReadInboxMessageId": 0,
    "unreadCount": 0,
    "unreadMentionsCount": 0,
    "unreadReactionsCount": 0,
    "isMuted": false,
    "isMin": false,
    "hasPrivateLink": false,
    "isSignaturesShown": false,
    "usernames": user.usernames,
    "accessHash": "",
    "isVerified": false,
    "isJoinToSend": false,
    "isJoinRequest": false,
    "isForum": false,
    "isListed": true,
    "settings": {
      "isAutoArchived": false,
      "canReportSpam": false,
      "canAddContact": false,
      "canBlockContact": false
    }
  }
}

export async function getBotChat(bot_id){
  const user = await getUserFromCache(bot_id);
  return {
    "id": bot_id,
    "type": "chatTypePrivate",
    "title": user.firstName,
    "lastReadOutboxMessageId": 0,
    "lastReadInboxMessageId": 0,
    "unreadCount": 0,
    "unreadMentionsCount": 0,
    "unreadReactionsCount": 0,
    "isMuted": false,
    "isMin": false,
    "hasPrivateLink": false,
    "isSignaturesShown": false,
    "usernames": user.usernames,
    "accessHash": "",
    "hasVideoAvatar": false,
    "isVerified": true,
    "isJoinToSend": false,
    "isJoinRequest": false,
    "isForum": false,
    // "lastMessage": msg,
    "isListed": true,
    "settings": {
      "isAutoArchived": false,
      "canReportSpam": false,
      "canAddContact": false,
      "canBlockContact": false
    }
  }
}

export async function getChats(user_id?:string){
  const listIds_active = [];
  const chats = [];
  let byChatId:any = {};
  let byId = {}
  if(user_id){
    listIds_active.push(user_id);
    const currentUserChat = await getChat(user_id);
    chats.push(currentUserChat)
    byId = {
      [user_id]:currentUserChat
    }
    byChatId = {
      [user_id]:{
        byId:{},
        threadsById:{
          "-1":{
            lastViewportIds:[],
            listedIds:[],
            lastScrollOffset:undefined,
            noWebPage:undefined
          }
        }
      }
    };
  }
  const chatGpt = ENV.USER_ID_CHATGPT;
  const bots = [chatGpt]
  let totalCount_all = 1


  for (let i = 0; i < bots.length; i++) {
    const bot_id = bots[i];
    byId[bot_id] = await getBotChat(bot_id);
    chats.push(byId[bot_id])
    totalCount_all +=1;
    listIds_active.push(bot_id)
    byChatId[bot_id] = {
      byId:{},
      threadsById:{
        "-1":{
          lastViewportIds:[],
          listedIds:[],
          lastScrollOffset:undefined,
          noWebPage:undefined
        }
      }
    }
  }

  return {
    draftsById:{},
    replyingToById:{},
    chatIds:listIds_active,
    chats,
  }
}

export async function getChatFolder(){
  const chatGpt = ENV.USER_ID_CHATGPT;
  return {
    "byId": {
      "2": {
        "id": 2,
        "title": "bot",
        "channels": false,
        "pinnedChatIds": [],
        "includedChatIds": [
          chatGpt
        ],
        "excludedChatIds": []
      }
    },
    "orderedIds": [
      0,
      2
    ]
  }

}

export async function loadChats(user_id?:string){
  const chatFolders = await getChatFolder()
  const users = await getUsers(user_id);
  const chats = await getChats(user_id);

  return {
    ...users,
    ...chats,
    chatFolders
  }

}
