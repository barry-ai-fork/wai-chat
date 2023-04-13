import MsgDispatcher from "./MsgDispatcher";
import {selectChat, selectUser} from "../../global/selectors";
import {updateUser} from "../../global/reducers";
import {getActions, getGlobal, setGlobal} from "../../global";
import {ApiBotCommand} from "../../api/types";
import {currentTs} from "../share/utils/utils";
import {GlobalState} from "../../global/types";
import MsgCommandSetting from "./MsgCommandSetting";
import {ControllerPool} from "../../lib/ptp/functions/requests";
import MsgCommandChatGpt from "./MsgCommandChatGpt";
import MsgCommandChatLab from "./MsgCommandChatLab";
import {UserStoreRow_Type} from "../../lib/ptp/protobuf/PTPCommon/types";
import {callApiWithPdu} from "./utils";
import {DownloadUserReq, DownloadUserRes, UploadUserReq} from "../../lib/ptp/protobuf/PTPUser";

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
    setTimeout(async ()=>{
      const lastMessage = MsgDispatcher.buildMsgHistoryClear(chatId)
      lastMessage.id = await MsgDispatcher.genMsgId()
      MsgDispatcher.newMessage(chatId,lastMessage.id,lastMessage)
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
      await MsgDispatcher.newTextMessage(chatId,await MsgDispatcher.genMsgId(),"重载成功")
      return true;
    }
  }
  static async uploadUser(global:GlobalState,chatId:string){
    const users:UserStoreRow_Type[] = [];
    const ids = [chatId]
    for (let i = 0; i < ids.length; i++) {
      if(i > 0){
        break
      }
      const id = ids[i];
      users.push({
        time:currentTs(),
        userId:id!,
        user:selectUser(global,chatId)
      })
    }
    await callApiWithPdu(new UploadUserReq({
      users,
      time:currentTs()
    }).pack())
    MsgDispatcher.showNotification("上传成功")
  }
  static async downloadUser(global:GlobalState,chatId:string){
    const DownloadUserReqRes = await callApiWithPdu(new DownloadUserReq({
      userIds:[chatId],
    }).pack())
    const downloadUserRes = DownloadUserRes.parseMsg(DownloadUserReqRes?.pdu!)
    if(downloadUserRes.users){
      const {user} = downloadUserRes.users[0]
      global = getGlobal();
      // @ts-ignore
      global = updateUser(global,user!.id, user)
      setGlobal(global)
    }
    MsgDispatcher.showNotification("更新成功")
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
