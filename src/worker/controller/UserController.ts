import {kv, ENV} from "../helpers/env";

export async function saveBotIds(botIds:string[],authUid?:string){
  await kv.put(`BOT_${authUid ? authUid: 'PUB'}`,JSON.stringify(botIds))
}

export async function getBotIds(authUid?:string){
  const botIds_str = await kv.get(`BOT_${authUid ? authUid: 'PUB'}`);
  return botIds_str ? JSON.parse(botIds_str) : []
}

export async function initSystemBot(){
  // const botFather = await getBot(ENV.USER_ID_BOT_FATHER);
  // if(!botFather){
  //   const desc = "BotFather是主宰所有机器人的机器人。使用它可以创建新的机器人账户和管理已有的机器人。"
  //   await createBot(ENV.USER_ID_BOT_FATHER,
  //     "BotFather",
  //     "BotFather",
  //     desc,
  //     {isPremium:true},
  //     {
  //       "menuButton": {
  //         "type": "commands"
  //       },
  //       "commands": [
  //         {
  //           "botId": ENV.USER_ID_BOT_FATHER,
  //           "command": "start",
  //           "description": "Start Chat"
  //         }
  //       ]
  //     }
  //   )
  // }
  const chatGpt = await getBot(ENV.USER_ID_CHATGPT);
  if(!chatGpt){
    const desc = "ChatGPT是基于GPT（Generative Pre-trained Transformer）模型的聊天机器人，可以进行智能对话和自动生成文章。ChatGPT通过深度学习技术，对大量文本进行学习，并可生成符合上下文的语句，从而能够进行更加人性化的对话。"
    await createBot(ENV.USER_ID_CHATGPT,
      "ChatGpt", "ChatGpt",
      desc,
      {isPremium:true},
      {
        "menuButton": {
          "type": "commands"
        },
        "commands": [
          {
            "botId": ENV.USER_ID_CHATGPT,
            "command": "start",
            "description": "Start Chat"
          },
          {
            "botId": ENV.USER_ID_CHATGPT,
            "command": "history",
            "description": "获取当前有效Prompt和对话的历史记录"
          },
          {
            "botId": ENV.USER_ID_CHATGPT,
            "command": "clear",
            "description": "清除当前有效Prompt和对话的历史记录"
          }
        ]
      }
      )
  }
  const botIds = await getBotIds();
  let flag = false;
  // if(!botIds.includes(ENV.USER_ID_BOT_FATHER)){
  //   botIds.push(ENV.USER_ID_BOT_FATHER)
  //   flag = true;
  // }
  if(!botIds.includes(ENV.USER_ID_CHATGPT)){
    botIds.push(ENV.USER_ID_CHATGPT)
    flag = true;
  }
  if(flag){
    await saveBotIds(botIds);
  }
}

export async function createBot(
  bot_id:string,user_name:string,first_name:string,
  description:string,options?:Record<string, any>,botInfo?:Record<string, any>){
  const info = {
    isSelf:false,
    "id": bot_id,
    "isMin": false,
    "isPremium": false,
    "type": "userTypeBot",
    firstName:first_name,
    hasVideoAvatar:false,
    "canBeInvitedToGroup": false,
    usernames:[
      {
        "username": user_name,
        "isActive": true,
        "isEditable": true
      }
    ],
    "phoneNumber": "",
    "noStatus": true,
    accessHash:"",
    "fullInfo": {
      "commonChatsCount": 0,
      "isBlocked": false,
      "noVoiceMessages": false,
      "botInfo": {
        "botId": bot_id,
        "description": description,
        ...botInfo
      },
    },
    "photos": [],
    ...options
  }
  await kv.put(`BOT_${bot_id}`,JSON.stringify(info))
  return info;
}

export async function getBot(bot_id:string){
  const res = await kv.get(`BOT_${bot_id}`);
  return res ? JSON.parse(res) :null;
}


export async function getUser(user_id:string,isSelf:boolean = false,options?:Record<string, any>){
  const userJsonStr = await kv.get(`U_${user_id}`);
  let user = {
    username:"",
    first_name:"",
  };
  if(userJsonStr){
    user = JSON.parse(userJsonStr);
  }

  const usernames = [];
  let firstName = "";
  if(user.username){
    usernames.push({
      "username": user.username,
      "isActive": true,
      "isEditable": true
    })
  }

  if(user.first_name){
    firstName = user.first_name
  }

  const accessHash = "";
  return {
    isSelf,
    "id": user_id,
    "isMin": false,
    "isPremium": false,
    "type": "userTypeRegular", //userTypeBot
    firstName,
    usernames,
    "phoneNumber": "",
    "noStatus": false,
    accessHash,
    "fullInfo": {
      "commonChatsCount": 0,
      "isBlocked": false,
      "noVoiceMessages": false,
    },
    "photos": [],
    ...options
  }
}

export async function getUsers(user_id?:string){
  const users = [];
  let userStatusesById:any = {};
  if(user_id){
    userStatusesById[user_id] = {
      [user_id]:{
        "type": "userStatusOnline",
        "expires": Math.ceil(+(new Date())/1000) + 24 * 3600
      }
    }
  }
  const chatGpt = ENV.USER_ID_CHATGPT;
  const bots = [chatGpt]

  const ids = await getBotIds()
  ids.forEach((id:string)=>{
    bots.push(id)
  })

  if(user_id){
    const ids = await getBotIds(user_id)
    ids.forEach((id:string)=>{
      if(!bots.includes(id)){
        bots.push(id)
      }
    })
  }

  for (let i = 0; i < bots.length; i++) {
    const bot_id = bots[i];
    users.push(await getBot(bot_id))
    userStatusesById[bot_id] = {
      "type": "userStatusEmpty"
    }
  }
  return {
    users,
    userStatusesById
  }
}

export async function getChat(user_id:string,isBot?:boolean){
  const user = isBot ? await getBot(user_id) : await getUser(user_id);
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

export async function getBotChat(bot_id:string){
  const user = await getBot(bot_id);
  console.log(bot_id,user)
  return {
    "id": bot_id,
    "type": "chatTypePrivate",
    "title": user.firstName || "demo",
    "lastReadOutboxMessageId": 0,
    "lastReadInboxMessageId": 0,
    "unreadCount": 0,
    "unreadMentionsCount": 0,
    "unreadReactionsCount": 0,
    "isMuted": false,
    "isMin": false,
    "hasPrivateLink": false,
    "isSignaturesShown": false,
    "usernames": user.usernames || "test",
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
  let byId:Record<string, any> = {}

  if(user_id){
    // listIds_active.push(user_id);
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
  const botFather = ENV.USER_ID_BOT_FATHER;
  const bots = [chatGpt]
  let totalCount_all = 1

  const ids = await getBotIds()
  ids.forEach((id:string)=>{
    bots.push(id)
  })

  if(user_id){
    const ids = await getBotIds(user_id)
    ids.forEach((id:string)=>{
      if(!bots.includes(id)){
        bots.push(id)
      }
    })
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
  }
}

export async function getChatFolder(){
  const chatGpt = ENV.USER_ID_CHATGPT;
  const botFather = ENV.USER_ID_BOT_FATHER;
  return {
    "byId": {
      "2": {
        "id": 2,
        "title": "Bot",
        "channels": false,
        "pinnedChatIds": [],
        "includedChatIds": [
          chatGpt,
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
  console.log({users,chats})
  return {
    ...users,
    ...chats,
    chatFolders
  }
}


