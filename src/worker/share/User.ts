import {ApiBotInfo, ApiUser, ApiUserStatus, ApiUserType} from "../../api/types";
import {ENV, kv} from "../helpers/env";
import {Chat} from "./Chat";
import {UserIdAccountIdMap} from "../controller/WsController";
import {Msg} from "./Msg";

export class User{
  private user: ApiUser
  constructor(user:ApiUser) {
    this.user = user;
  }

  getUserInfo(){
    return this.user;
  }

  setUserInfo(user:ApiUser){
    this.user = user;
  }

  async updateChatId(chatId:string,msgId:number =0){
    await kv.put(`UC_${this.user.id}_${chatId}`,msgId.toString())
  }

  async getLastMsgId(chatId:string){
    const msgId =  await kv.get(`UC_${this.user.id}_${chatId}`)
    return msgId ? parseInt(msgId) : 0;
  }

  static getDefaultChatFolder(){
    return {
      "byId": {
        "1": {
          "id": 1,
          "title": "Bot",
          "channels": false,
          "pinnedChatIds": [],
          "includedChatIds": User.getPublicBots(),
          "excludedChatIds": []
        }
      },
      "orderedIds": [
        0,
        1
      ]
    }
  }
  async getChatFolder(){
    const res = await kv.get(`UCF_${this.user.id}`);
    if(res){
      return JSON.parse(res);
    }else{
      return null;
    }
  }
  async updateChatFolder(chatFoler:any){
    await kv.put(`UCF_${this.user.id}`,JSON.stringify(chatFoler));
  }
  static async getChatIds(user_id?:string){
    const rows = await kv.list({
      prefix:`UC_${user_id}_`
    })
    const res = [];
    for (let i = 0; i < rows.length; i++) {
      const key = rows[i];
      const chatId = key.name.replace(`UC_${user_id}_`,"");
      const msgId = await kv.get(key.name)
      res.push({chatId,msgId:parseInt(msgId)})
    }
    res.sort((a,b)=>b.msgId - a.msgId)
    const chatIds = [];
    for (let i = 0; i < res.length; i++) {
      chatIds.push(res[i].chatId)
    }
    return chatIds
  }

  static async getChatsByChatIds(chatIds:string[]){
    const chats = [];
    for (let i = 0; i < chatIds.length; i++) {
      const chat = await Chat.getFromCache(chatIds[i])
      chats.push(chat?.getChatInfo())
    }
    return chats
  }

  static async getChats(user_id?:string){
    const chatIds = await User.getChatIds(user_id);
    const chats = [];
    for (let i = 0; i < chatIds.length; i++) {
      const chat = await Chat.getFromCache(chatIds[i])
      chats.push(chat)
    }
    return chats
  }

  static format(user:{
    id:string,isSelf?:true,type?:ApiUserType,
    isPremium?:boolean;first_name?:string,user_name?:string
  },bot?:ApiBotInfo,bio?:string):ApiUser{
    const usernames = user.user_name ? [{
      "username": user.user_name,
      "isActive": true,
      "isEditable": true
    }] :undefined

    return {
      "id": user.id,
      isSelf:user.isSelf,
      firstName:user.first_name || "",
      usernames:usernames,
      "isMin": false,
      "isPremium": user.isPremium || false,
      "type": user.type||'userTypeRegular',
      hasVideoAvatar:false,
      "canBeInvitedToGroup": false,
      "phoneNumber": "",
      "noStatus": true,
      accessHash:"",
      "fullInfo": {
        bio,
        "commonChatsCount": 0,
        "isBlocked": false,
        "noVoiceMessages": false,
        botInfo:bot ? bot:undefined
      },
      // "avatarHash": "5942933258171459000",
      // "photos": [
      //   {
      //     "id": "5942933258171459000",
      //     "thumbnail": {
      //       "dataUri": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wAARCAAoACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDMZyT/AIVLaQNcS46KOpquf0rQs/3YUHgdWqSy8tnaiMqkas3qcmoZrMJB5kPQfeUnpV23njfO09PalLoSSCCrdaGhHP7GlkYDqBRV6yhAvp0P8PFFLXoMzYVDyhTyPT1rR8xVn8koMd/estWKOGHUHIq55jXLLIBtZRz702JGtGsUTqiRnDL1AzSrBHHLsUnLZ71UhZGYE7t/oP8AGlSQS3LSq4YoccdhQMsW8ZF/OexOaKS2nM80uw46AEiimiTBlTa+PanQ72Gxfu98d6KKOgLc0rbTgzEz7wvZd1Q6iohul8oBAEGNtFFCBiWd40DH5QQevrRRRV2RFz//2Q==",            "width": 640,
      //       "height": 640
      //     },
      //     "sizes": [
      //       {
      //         "width": 160,
      //         "height": 160,
      //         "type": "s"
      //       },
      //       {
      //         "width": 320,
      //         "height": 320,
      //         "type": "m"
      //       },
      //       {
      //         "width": 640,
      //         "height": 640,
      //         "type": "x"
      //       }
      //     ]
      //   }
      // ]
    }
  }
  async save(){
    await kv.put(`U_${this.user.id}`,JSON.stringify(this.user))
  }
  isBot(){
    return !!this.user?.fullInfo?.botInfo
  }
  static async getFromCache(id:string){
    let t = await kv.get(`U_${id}`)
    if(t){
      t = JSON.parse(t);
      const u = new User(t.id)
      u.user = t;
      return u
    }else{
      return null
    }
  }
  static getPublicBots(){
    const {USER_IDS_PUBLIC} = ENV;
    return USER_IDS_PUBLIC
  }
  static async loadChats(user_id?:string){
    let chatIds = [];
    let userStatusesById:Record<string, ApiUserStatus>  = {};
    let chatFolders = User.getDefaultChatFolder();
    let chats = []

    if(user_id){
      let user = await User.getFromCache(user_id);
      if(!user){
        const user = new User(User.format({
          id:user_id,
        }))
        await user.save();
        chatFolders = await user.getChatFolder();
      }
      chatIds = await User.getChatIds(user_id)
      chats = await User.getChatsByChatIds(chatIds);
      for (let i = 0; i < chats.length; i++) {
        const msgId = await user?.getLastMsgId(chats[i]!.id)
        const lastMessage = await Msg.getMsgFromCache(user_id,chats[i]!.id,msgId!)
        chats[i]!.lastMessage = lastMessage ? lastMessage.msg : undefined
      }
    }else{
      chatIds = User.getPublicBots();
      chats = await User.getChatsByChatIds(chatIds);
    }

    const users = [];
    for (let i = 0; i < chatIds.length; i++) {
      if(chatIds.indexOf("-") === -1){
        const user = await User.getFromCache(chatIds[i])
        if(user){
          const id = user?.getUserInfo()!.id!;
          if(id === user_id){
            user!.getUserInfo().isSelf = true;
          }
          users.push(user?.getUserInfo())
          if(!user?.isBot()){
            if(UserIdAccountIdMap[id]){
              userStatusesById[id] = {
                "type": "userStatusOnline",
                "expires": Math.ceil(+(new Date())/1000) + 24 * 3600
              }
            }else{
              userStatusesById[id] = {
                "type": "userStatusOffline",
              }
            }
          }else{
            userStatusesById[id] = {
              "type": "userStatusEmpty",
            }
          }
        }
      }
    }
    const res = {
      publicBotIds:User.getPublicBots(),
      userStatusesById,
      users,
      chats,
      chatIds,
      chatFolders,
      draftsById:{},
      replyingToById:{},
      orderedPinnedIds:[],
      totalChatCount:chatIds.length
    }
    // console.log("========>>","loadChats",JSON.stringify(res))
    return res
  }
  static async init(user_id:string){
    let user = await User.getFromCache(user_id);
    if(!user){
      user = new User(User.format({id:user_id}))
      await user.save()
    }
    let chat = await Chat.getFromCache(user_id);
    if(!chat){
      chat = new Chat(Chat.format({
        id:user_id,
      }))
      await chat.save();
      await user.updateChatId(user_id)
      const chatIds = User.getPublicBots()
      for (let i = 0; i < chatIds.length; i++) {
        await user.updateChatId(chatIds[i])
      }
      const ChatFolder = User.getDefaultChatFolder();
      await user.updateChatFolder(ChatFolder)
    }

  }

}
