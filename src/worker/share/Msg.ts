import Account from "./Account";
import {SendRes} from "../../lib/ptp/protobuf/PTPMsg";
import {ERR} from "../../lib/ptp/protobuf/PTPCommon";
import {ENV, kv} from "../helpers/env";
import {USER_CONFIG} from "../helpers/context";
import {Pdu} from "../../lib/ptp/protobuf/BaseMsg";
import {UserIdAccountIdMap} from "../controller/WsController";
import {ApiMessage} from "../../api/types";
import {AiChatRole} from "../types";

type MsgType = "newMessage" | "updateMessageSendSucceeded";

export class Msg{
  public chatId: string;
  public user_id: string;
  public senderId: string;
  public aiRole?: AiChatRole;
  public msg?:ApiMessage
  constructor({chatId,user_id,senderId}:{chatId:string,user_id:string,senderId?:string}) {
    this.chatId = chatId;
    this.senderId = senderId||"";
    this.user_id = user_id
  }

  async send(msgType:MsgType = "newMessage",payloadOther?:Record<string, any>,seqNum:number=0){
    if(this.msg){
      const pdu = new SendRes({
        err:ERR.NO_ERROR,
        action: msgType,
        payload:JSON.stringify({
          msg:this.msg,
          ...payloadOther
        })
      }).pack();
      await this.broadcast(pdu,seqNum);
    }
  }
  formatMsg(){
    return {
      chatId:this.chatId,
      senderId:this.senderId,
      date:Msg.genMsgDate(),
      isOutgoing:false,
      isForwardingAllowed:true,
      isFromScheduled:false,
      isSilent:false,
      isProtected:false,
    }
  }
  setMsg(msg:ApiMessage){
    this.msg = msg;
  }

  async sendText(text:string,msgType:MsgType = 'updateMessageSendSucceeded',other:Record<string, any> = {},msgId?:number){

    const entities = other.entities || undefined
    this.setMsg({
      id:msgId || await this.incrMsgId(),
      ...this.formatMsg(),
      content:{
        text:{
          text:text,
          entities,
        }
      },
      ...other
    });
    await this.send(msgType);
  }

  async getAllKeys(){
    const keys = await kv.list({
      prefix:`MSG_${this.user_id}_${this.chatId}_`
    });
    return keys.map(key=>key.name);
  }

  async getAllMsgList(){
    const keys = await this.getAllKeys();
    const rows = [];
    for (let i = 0; i < keys.length; i++) {
      rows.push(JSON.parse(await kv.get(keys[i])))
    }
    return rows;
  }
  async clearAiMsgHistory() {
    const keys = await this.getAllKeys();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const json = JSON.parse(await kv.get(key));
      if(json.aiRole !== AiChatRole.NONE){
        json.aiRole = AiChatRole.NONE;
        await kv.put(key,JSON.stringify(json));
      }
    }
  }
  static async getMsgFromCache(user_id:string,chatId:string,msgId:number){
    const str = await kv.get(`MSG_${user_id}_${chatId}_${msgId}`)
    if(str){
      const json = JSON.parse(str)
      const msg = new Msg({user_id,chatId})
      msg.setMsg(json.msg)
      return msg;
    }else{
      return null
    }
  }
  async getAiMsgHistory(){
    const keys = await this.getAllKeys();
    const history = [
      {role: 'system', content: USER_CONFIG.SYSTEM_INIT_MESSAGE},
    ];

    const msgIds = []
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const [prefix,user_id,chatId,msgId] = key.split("_");
      msgIds.push(parseInt(msgId));
    }
    msgIds.sort((a,b)=>(a - b))
    for (let i = 0; i < msgIds.length; i++) {
      const msgId = msgIds[i]
      const json = JSON.parse(await kv.get(`MSG_${this.user_id}_${this.chatId}_${msgId}`));
      const obj = new Msg({
        user_id:this.user_id!,
        chatId:this.chatId,
        senderId:json.senderId,
      });
      obj.aiRole = json.aiRole;
      obj.setMsg(json.msg)
      if(obj.aiRole!== undefined && obj.aiRole !== AiChatRole.NONE){
        history.push({
          role:obj.aiRole === AiChatRole.USER ? "user" : "assistant",
          content:obj.getMsgText()
        })
      }
    }
    const MAX_TOKEN_LENGTH = 2000;
    if (ENV.AUTO_TRIM_HISTORY && ENV.MAX_HISTORY_LENGTH > 0) {
      // 历史记录超出长度需要裁剪
      if (history.length > ENV.MAX_HISTORY_LENGTH) {
        history.splice(history.length - ENV.MAX_HISTORY_LENGTH + 2);
      }
      // 处理token长度问题
      let tokenLength = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        const historyItem = history[i];
        let length = 0;
        if (historyItem.content) {
          length = Array.from(historyItem.content).length;
        } else {
          historyItem.content = '';
        }
        // 如果最大长度超过maxToken,裁剪history
        tokenLength += length;
        if (tokenLength > MAX_TOKEN_LENGTH) {
          history.splice(i);
          break;
        }
      }
    }
    return history;
  }

  async broadcast(pdu:Pdu,seqNum:number=0){
    const user_id = this.user_id
    if(UserIdAccountIdMap[user_id]){
      for (let i = 0; i < UserIdAccountIdMap[user_id].length; i++) {
        const account = UserIdAccountIdMap[user_id][i]
        if(user_id === account.getUid()){
          pdu.updateSeqNo(seqNum)
        }else{
          pdu.updateSeqNo(0)
        }
        account.sendPdu(pdu)
      }
    }
  }
  static genMsgDate(){
    return Math.ceil(+(new Date)/1000)
  }

  getMsgText(){
    if(this.msg && this.msg.content.text && this.msg.content.text.text){
      return this.msg.content.text.text;
    }else{
      return "";
    }
  }
  setMsgText(text:string){
    if(this.msg){
      this.msg!.content!.text!.text = text
    }
  }
  async genMsgId(){
    let msgId =  await kv.get(`MSG_INCR_${this.user_id}`);
    if(!msgId){
      msgId = 10000;
    }else{
      msgId = parseInt(msgId) + 1;
    }
    return msgId
  }

  async saveMsgId(msgId:number){
    await kv.put(`MSG_INCR_${this.user_id}`,msgId.toString())
    return msgId
  }
  async incrMsgId(){
    return await this.saveMsgId(await this.genMsgId());
  }
  async save(){
    if(this.msg){
      await kv.put(`MSG_${this.user_id}_${this.chatId}_${this.msg.id}`,JSON.stringify({
        aiRole:this.aiRole,
        msg:this.msg
      }));
    }
  }

  static async deleteMsg(user_id: string, chat_id: string, msg_ids: number[] | undefined) {
    if(msg_ids && msg_ids.length > 0){
      for (let i = 0; i < msg_ids.length; i++) {
        const msg_id = msg_ids[i];
        await kv.delete(`MSG_${user_id}_${chat_id}_${msg_id}`)
      }
    }
  }
}
