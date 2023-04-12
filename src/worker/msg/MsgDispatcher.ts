import {
  ApiAttachment, ApiBotInfo,
  ApiChat,
  ApiFormattedText,
  ApiKeyboardButtons,
  ApiMessage,
  ApiMessageEntity,
  ApiNewPoll,
  ApiSticker,
  ApiUser,
  ApiVideo
} from "../../api/types";
import {GlobalState} from "../../global/types";
import {getActions, getGlobal} from "../../global";
import {callApiWithPdu} from "./utils";
import {currentTs} from "../share/utils/utils";
import {GenMsgIdReq, GenMsgIdRes} from "../../lib/ptp/protobuf/PTPMsg";
import MsgCommand from "./MsgCommand";
import {parseCodeBlock} from "../share/utils/stringParse";
import MsgWorker from "./MsgWorker";
import {UserIdFirstBot} from "../setting";
import MsgCommandChatGpt from "./MsgCommandChatGpt";
import MsgCommandSetting from "./MsgCommandSetting";
import {selectUser} from "../../global/selectors";

export type ParamsType = {
  chat: ApiChat;
  text?: string;
  entities?: ApiMessageEntity[];
  replyingTo?: number;
  attachment?: ApiAttachment;
  sticker?: ApiSticker;
  gif?: ApiVideo;
  poll?: ApiNewPoll;
  isSilent?: boolean;
  scheduledAt?: number;
  sendAs?: ApiChat | ApiUser;
  replyingToTopId?: number;
  groupedId?: string;
  botInfo?: ApiBotInfo
}
export type OptionsType = {
  senderId?:string,
  inlineButtons?:ApiKeyboardButtons
  isLocalMessageId?:boolean,
}

export default class MsgDispatcher {
  private params: ParamsType;
  private global: GlobalState;
  private msgCommand: MsgCommand;
  constructor(global:GlobalState,params: ParamsType) {
    this.global = global;
    this.params = params;
    this.msgCommand = new MsgCommand(this)
  }

  static apiUpdate(update:any){
    const {apiUpdate} = getActions()
    apiUpdate(update)
  }
  getMsgSenderAsId(){
    return this.params.sendAs?.id;
  }
  getMsgText(){
    return this.params.text;
  }

  getChatId(){
    return this.params.chat.id;
  }
  genMsgDate(){
    return Math.ceil(+(new Date())/1000);
  }

  static async genMsgId(isLocal?:boolean){
    // @ts-ignore
    const {pdu} = await callApiWithPdu(new GenMsgIdReq({isLocal:!!isLocal}).pack())
    const {messageId} = GenMsgIdRes.parseMsg(pdu)
    return messageId
  }

  updateMessageSendSucceeded(localId:number,message:ApiMessage){
    MsgDispatcher.apiUpdate({
      '@type': "updateMessageSendSucceeded",
      localId,
      chatId: this.params.chat.id,
      message: message
    });
  }
  updateMessageText(id:number,{text}:{text: any},message:ApiMessage){
    this.updateMessage(id,{
      ...message,
      content:{
        ...message.content,
        text: {
          ...message.content.text,
          text
        }
      }
    })
  }
  updateMessage(id:number,message:Partial<ApiMessage>){
    return MsgDispatcher.updateMessage(this.getChatId(),id,message)
  }
  static updateMessage(chatId:string,messageId:number,message:Partial<ApiMessage>){
    MsgDispatcher.apiUpdate({
        '@type': "updateMessage",
        id: messageId,
        chatId,
        message,
      });
    return message
  }
  static newMessage(chatId:string,messageId:number,message:ApiMessage){
    const global = getGlobal();
    const user = selectUser(global,chatId)
    if(user && user.fullInfo?.botInfo){
      message = MsgWorker.handleBotCmdText(message,user.fullInfo?.botInfo)
    }
    MsgDispatcher.apiUpdate({
      '@type': "newMessage",
      chatId,
      id:messageId,
      message,
      shouldForceReply:false
    });
    return message
  }
  async sendNewMessage(content:{text?:ApiFormattedText},options:OptionsType){
    const {isLocalMessageId,senderId,inlineButtons} = options || {}
    const id = await MsgDispatcher.genMsgId(!!isLocalMessageId)
    const message = {
      id,
      content,
      inlineButtons,
      chatId: this.getChatId(),
      date: this.genMsgDate(),
      senderId:this.getMsgSenderAsId(),
      isOutgoing:(senderId || this.getMsgSenderAsId()) !== this.getChatId(),
      sendingState: undefined
    }
    if(this.params.botInfo){
      MsgWorker.handleBotCmdText(message,this.params.botInfo)
    }
    return MsgDispatcher.newMessage(this.getChatId(),id,message)
  }
  async sendNewTextMessage({text,options}:{text?:string,options?:OptionsType}){
    const res = parseCodeBlock(text!)
    // @ts-ignore
    return await this.sendNewMessage({text:res!,},options)
  }

  async replyText(text:string){
    return await this.replyNewTextMessage({text})
  }

  async replyCode(text:string){
    return await this.replyNewTextMessage({text:"```\n"+text+"```"})
  }

  async replyNewTextMessage({text,options}:{text?:string,options?:OptionsType}){
    this.focusLastMessage(200)
    return await this.sendNewTextMessage({text,options:{
      ...options,
        senderId:this.getChatId()
      }})

  }
  async sendOutgoingMsg(){
    this.focusLastMessage(100)
    return await this.sendNewTextMessage({
      text:this.getMsgText(),
    })
  }
  static buildMsgHistoryClear(chatId:string):ApiMessage{
    return {
      id: 0,
      chatId,
      isOutgoing: false,
      date: currentTs(),
      content: {
        action: {
          text: "历史记录已清空",
          type: 'historyClear',
          translationValues:[],
        }
      }
    }
  }
  getBotCommands(){
    const {botInfo} = this.params;
    if(botInfo && botInfo.commands){
      const commands: string[] = []
      botInfo.commands.forEach(cmd=>commands.push("/"+cmd.command))
      return commands
    }else{
      return []
    }
  }
  async processCmd(){
    let res;
    const sendMsgText = this.getMsgText();
    const commands = this.getBotCommands();
    if(sendMsgText && commands.includes(sendMsgText)){
      if(this.params.botInfo?.botId === UserIdFirstBot){
        return await this.processFirstBotCmd();
      }
      if(this.params.botInfo?.aiBot?.chatGptConfig){
        return await this.processAiBotCmd();
      }
    }

    return true
  }

  async processAiBotCmd(){
    const sendMsgText = this.getMsgText();
    const msgCommandChatGpt = new MsgCommandChatGpt(this.getChatId(),this.params.botInfo!);
    await this.sendOutgoingMsg();
    switch(sendMsgText){
      case "/start":
        return await msgCommandChatGpt.start();
      case "/clearHistory":
        return await MsgCommand.clearHistory(this.getChatId());
      case "/enableAi":
        return await msgCommandChatGpt.enableAi();
      case "/aiModel":
        return await msgCommandChatGpt.aiModel();
      case "/initPrompt":
        return await msgCommandChatGpt.initPrompt();
      case "/apiKey":
        return await msgCommandChatGpt.apiKey();
      default:
        return await this.sendOutgoingMsg();
    }
  }
  async processFirstBotCmd(){
    const sendMsgText = this.getMsgText();
    switch(sendMsgText){
      case "/start":
        await this.sendOutgoingMsg();
        return MsgCommandSetting.start(this.getChatId())
      case "/reloadCommands":
        return await this.msgCommand.reloadCommands();
      case "/clearHistory":
        return await MsgCommand.clearHistory(this.getChatId());
      case "/temp":
        return await this.msgCommand.temp();
      case "/setting":
        return await this.msgCommand.setting();
      default:
        return await this.sendOutgoingMsg();
    }
  }
  focusLastMessage(delay:number = 500){}
  async process(){
    let res;
    if(this.getMsgText()?.startsWith("/")){
      res = this.processCmd();
    }
    return res
  }
}
