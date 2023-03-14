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

export async function getChats(user_id){
  const currentUserChat = await getChat(user_id);
  const listIds_active = [
    user_id
  ];
  const chats = [];
  chats.push(currentUserChat)
  const byChatId = {
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
  const chatGpt = ENV.USER_ID_CHATGPT;
  const bots = [chatGpt]
  let totalCount_all = 1
  const byId = {
    [user_id]:currentUserChat
  }

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

    // messages:{
    //   byChatId,
    // },
    // chats:{
    //   byId,
    //   "listIds": {
    //     "active": listIds_active,
    //     "archived": []
    //   },
    //   "isFullyLoaded": {},
    //   "orderedPinnedIds": {
    //     "active": [],
    //     "archived": []
    //   },
    //   "totalCount": {
    //     "all": totalCount_all,
    //     "archived": 0
    //   }
    // }
  }
}

export async function getChatFolder(user_id){
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

export async function loadChats(dataJson,user_id,websocket){

  const users = await getUsers(user_id);
  const chats = await getChats(user_id);
  const chatFolders = await getChatFolder(user_id)

  let res = {
    seq_num:dataJson.seq_num,
    action:dataJson.action,
    data:{
      ...users,
      ...chats,
      chatFolders,
    }
  }
  if(websocket){
    websocket.send(stringToBuffer(JSON.stringify(res)))

  }
  return res;
}
