import MsgDispatcher from "./MsgDispatcher";
import {selectChat, selectChatMessage, selectUser} from "../../global/selectors";
import {updateChat, updateUser} from "../../global/reducers";
import {getActions, getGlobal, setGlobal} from "../../global";
import {ApiBotCommand} from "../../api/types";
import {callApiWithPdu} from "./utils";
import {currentTs} from "../share/utils/utils";

import {MessageStoreRow_Type, UserStoreRow_Type} from "../../lib/ptp/protobuf/PTPCommon/types";
import {UploadMsgReq} from "../../lib/ptp/protobuf/PTPMsg";
import {DownloadUserReq, UploadUserReq} from "../../lib/ptp/protobuf/PTPUser";
import Mnemonic from "../../lib/ptp/wallet/Mnemonic";
import Account from "../share/Account";
import {AuthNativeReq} from "../../lib/ptp/protobuf/PTPAuth";
import {GlobalState} from "../../global/types";
import {getPasswordFromEvent} from "../share/utils/password";
import {hashSha256} from "../share/utils/helpers";
import MsgCommandSetting from "./MsgCommandSetting";
import {ControllerPool} from "../../lib/ptp/functions/requests";
import MsgCommandChatGpt from "./MsgCommandChatGpt";
import MsgCommandChatLab from "./MsgCommandChatLab";

export default class MsgCommand {
  private msgDispatcher: MsgDispatcher;
  constructor(msgDispatcher:MsgDispatcher) {
    this.msgDispatcher = msgDispatcher;
  }
  static async sendText(chatId:string,text:string){
    const messageId = await MsgDispatcher.genMsgId();
    MsgDispatcher.newMessage(chatId,messageId,{
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:text
        }
      },
    })
  }
  static async clearHistory(chatId:string){
    let global = getGlobal();
    const chatMessages = global.messages.byChatId[chatId];
    const ids = Object.keys(chatMessages.byId).map(Number);
    const chat = selectChat(global,chatId)
    MsgDispatcher.apiUpdate({
      "@type":"deleteMessages",
      chatId,
      ids
    })
    setTimeout(()=>{
      global = getGlobal();
      global = updateChat(global,chatId,{
        ...chat,
        unreadCount:0,
        lastMessage:MsgDispatcher.buildMsgHistoryClear(chatId)
      })
      setGlobal(global)
    },500)

    return true;
  }

  async showMnemonic(){
    await this.msgDispatcher.sendOutgoingMsg();
    await this.msgDispatcher.replyText("显示成功")
    getActions().updateGlobal({
      showMnemonicModal:true
    })
  }
  async setAuth(){
    await this.msgDispatcher.sendOutgoingMsg();
    const m = "control combine high meat erode catalog public tumble rebel benefit upon public"
    const account = Account.getInstance(Account.genAccountId());
    const entropy = new Mnemonic(m).toEntropy();
    await account.setEntropy(entropy)
    const accountId = account.getAccountId();
    Account.setCurrentAccountId(accountId)
    const session = account?.getSession();
    if(!session){
      const {password} = await getPasswordFromEvent();
      if(password){
        const pwd = hashSha256(password)
        const ts = +(new Date());
        const {address, sign} = await account.signMessage(ts.toString(), pwd);
        const session = Account.formatSession({address,sign,ts});
        account.saveSession(session)
        const entropy = await account.getEntropy()
        const accountId = account.getAccountId();
        await callApiWithPdu(new AuthNativeReq({
          accountId,entropy,session
        }).pack())
        await this.msgDispatcher.replyText("账户设置成功")
        await this.msgDispatcher.replyCode(session)
        await this.msgDispatcher.replyCode(entropy)
        await this.msgDispatcher.replyCode(accountId.toString())
      }
    }else {
      await this.msgDispatcher.replyCode(session)
    }
  }
  async genMnemonic(){
    await this.msgDispatcher.sendOutgoingMsg();
    const m = new Mnemonic()
    return await this.msgDispatcher.replyNewTextMessage({text:m.getWords()})
  }
  async downloadBots(botId:string){
    let global = getGlobal();
    const user = selectUser(global,botId);

    await this.msgDispatcher.sendOutgoingMsg();
    const res = await callApiWithPdu(new DownloadUserReq({
      userIds:[user!.id!],
    }).pack())

    await this.msgDispatcher.replyNewTextMessage({text:`正在下载`})
    return true;

  }
  async uploadBots(botId:string){
    let global = getGlobal();
    const user = selectUser(global,botId);

    await this.msgDispatcher.sendOutgoingMsg();
    const users:UserStoreRow_Type[] = [];
    const ids = [user?.id]
    for (let i = 0; i < ids.length; i++) {
      if(i > 0){
        break
      }
      const id = ids[i];
      users.push({
        time:currentTs(),
        userId:id!,
        user:selectUser(global,botId)
      })
    }
    const res = await callApiWithPdu(new UploadUserReq({
      users,
      time:currentTs()
    }).pack())
    const text = await Account.getCurrentAccount()?.getEntropy();
    await this.msgDispatcher.replyNewTextMessage({text})
    return true;

  }
  async uploadMessages(chatId:string,messageIds?:number[]){
    let global = getGlobal();
    const chatMessages = global.messages.byChatId[chatId];
    const ids = Object.keys(chatMessages.byId).map(Number);
    await this.msgDispatcher.sendOutgoingMsg();
    const messages:MessageStoreRow_Type[] = [];
    for (let i = 0; i < ids.length; i++) {
      if(i > 0){
        break
      }
      const id = ids[i]

      messages.push({
        time:currentTs(),
        messageId:id,
        message:selectChatMessage(global,chatId,id)
      })
    }
    const res = await callApiWithPdu(new UploadMsgReq({
      messages,
      chatId,
      time:currentTs()
    }).pack())

    await this.msgDispatcher.replyNewTextMessage({text:`正在上传.. ${ids.length}`})
    return true;
  }
  static async reloadCommands(chatId:string,cmds:ApiBotCommand[]){
    let global = getGlobal();
    let user = selectUser(global,chatId)
    const botInfo = user?.fullInfo?.botInfo;
    if(botInfo){
      //@ts-ignore
      const commands:ApiBotCommand[] = cmds.map(cmd => {
        return {
          ...cmd,
          botId: user?.id
        };
      });
      global = updateUser(global,user?.id!,{
        ...user,
        fullInfo:{
          ...user?.fullInfo,
          botInfo:{
            ...user?.fullInfo!.botInfo!,
            commands
          }
        }
      })
      setGlobal(global)
      global = getGlobal()
      user = selectUser(global,chatId)

      MsgDispatcher.newTextMessage(chatId,await MsgDispatcher.genMsgId(),"重载成功")
      return true;
    }
  }
  async setting(){
    const chatId = this.msgDispatcher.getChatId()
    await this.msgDispatcher.sendOutgoingMsg();
    return await MsgCommandSetting.setting(chatId);
  }
  static async requestUploadImage(global:GlobalState,chatId:string,messageId:number,files:FileList | null){
    await MsgCommandSetting.requestUploadImage(global,chatId,messageId,files)
  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    console.log("answerCallbackButton",data)
    await MsgCommandSetting.answerCallbackButton(global,chatId,messageId,data)
    await MsgCommandChatGpt.answerCallbackButton(global,chatId,messageId,data)
    await MsgCommandChatLab.answerCallbackButton(global,chatId,messageId,data)
    if(data.startsWith("requestChatStream/stop/")){
      const [chatId,messageId] = data.replace("requestChatStream/stop/","").split("/").map(Number)
      ControllerPool.stop(chatId,messageId);
    }


  }
}
