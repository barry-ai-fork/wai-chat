import {kv, ENV} from "../helpers/env";

export async function createBot(id:string,user_name:string,first_name:string){
  const info = {
    isSelf:false,
    "id": id,
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
        "botId": id,
        "description": "BotFather is the one bot ",
        "menuButton": {
          "type": "commands"
        },
        "commands": [
          {
            "botId": "93372553",
            "command": "newbot",
            "description": "create a new bot"
          }
        ]
      }
    },
    "photos": []
  }
  await kv.delete(`MU_${id}`)
  await kv.put(`MU_${id}`,JSON.stringify(info))
  return info;
}

export async function getUserFromCache(user_id){
  return JSON.parse(await kv.get(`MU_${user_id}`));
}

export async function getUser(user_id:string,isSelf:boolean = false){
  const user = JSON.parse(await kv.get(`U_${user_id}`));
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
  }else{
    firstName = user.email.split("@")[0]
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
    "photos": []
  }
}

export async function getUsers(user_id){
  const users = [];
  const userStatusesById = {
    [user_id]:{
      "type": "userStatusOnline",
      "expires": Math.ceil(+(new Date())/1000) + 24 * 3600
    }
  }
  const chatGpt = ENV.USER_ID_CHATGPT;
  const bots = [chatGpt]
  for (let i = 0; i < bots.length; i++) {
    const bot_id = bots[i];
    users.push(await getUserFromCache(bot_id))
    userStatusesById[bot_id] = {
      "type": "userStatusEmpty"
    }
  }
  return {
    users,
    userStatusesById
  }
}

