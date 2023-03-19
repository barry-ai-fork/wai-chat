import {kv} from "../helpers/env";
import {ApiChat, ApiMessage, ApiUser} from "../../api/types";
import {ApiChatType} from "../../api/types";

export class Chat{
  private chat: ApiChat
  constructor(chat:ApiChat) {
    this.chat = chat;
  }
  getChatInfo(){
    return this.chat;
  }
  setChatInfo(chat:ApiChat){
    this.chat = chat;
  }

  static format(chat:{id:string,title?:string,lastMessage?:ApiMessage,type?:ApiChatType}):ApiChat{
    const usernames: never[] = [];
    const type =  chat.type || "chatTypePrivate";
    //@ts-ignore
    return{type,
      "id": chat.id,
      "lastMessage": chat.lastMessage,
      "title": chat.title || "",
      "usernames": usernames,
      // "lastReadOutboxMessageId": 0,
      // "lastReadInboxMessageId": 0,
      // "unreadCount": 0,
      // "unreadMentionsCount": 0,
      // "unreadReactionsCount": 0,
      "isMuted": false,
      "isMin": false,
      "hasPrivateLink": false,
      "isSignaturesShown": false,
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
  async save(){
    await kv.put(`C_${this.chat.id}`,JSON.stringify(this.chat))
  }
  static async getFromCache(id:string){
    // await kv.delete(`U_${id}`)
    let t = await kv.get(`C_${id}`)
    if(t){
      t = JSON.parse(t);
      const u = new Chat(t.id)
      u.chat = t;
      return u
    }else{
      return null
    }
  }
}
