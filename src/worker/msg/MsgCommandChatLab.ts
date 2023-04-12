import MsgDispatcher from "./MsgDispatcher";
import {ApiBotInfo} from "../../api/types";
import {UserIdFirstBot} from "../setting";
import {GlobalState} from "../../global/types";

export default class MsgCommandChatLab{
  private chatId: string;
  private botInfo: ApiBotInfo;
  constructor(chatId:string,botInfo:ApiBotInfo) {
    this.chatId = chatId
    this.botInfo = botInfo;
  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    switch (data){
      case `${chatId}/temp/PromptDemo`:
        const {cn} = require('./prompts.json')
        for (let i = 0; i < cn.length; i++) {
          const row = cn[i][1]
          const msgId = await MsgDispatcher.genMsgId();
          await MsgDispatcher.newTextMessage(chatId,msgId,row)
        }
        break
    }
  }
  async lab(){
    const messageId = await MsgDispatcher.genMsgId();
    return MsgDispatcher.newTextMessage(this.chatId,messageId,"welcome",[
        [
          {
            data:`${this.chatId}/temp/PromptDemo`,
            text:"PromptDemo",
            type:"callback"
          },
        ],
        [
          {
            text:"command button",
            type:'command'
          },
          {
            text:"unsupported button",
            type:'unsupported'
          },
          {
            text:"buy button",
            type:'buy'
          }
        ],
        [
          {
            text:"game button",
            type:'game'
          },
          {
            text:"requestPhone button",
            type:'requestPhone'
          }
        ],
        [
          {
            text:"receipt button",
            type:'receipt',
            receiptMessageId:1
          },
        ],
        [
          {
            text:"url button",
            type:'url',
            url:"http://www.ai.com"
          },
        ],
        [
          {
            text:"simpleWebView button",
            type:'simpleWebView',
            url:"http://www.ai.com"
          },
          {
            text:"webView button",
            type:'webView',
            url:"http://www.ai.com"
          },
        ],
        [
          {
            text:"requestPoll button",
            type:'requestPoll',
            isQuiz:true
          },
          {
            text:"switchBotInline button",
            type:'switchBotInline',
            query: "",
            isSamePeer: false
          },
          {
            text:"userProfile button",
            type:'userProfile',
            userId: UserIdFirstBot,
          },
        ],
        [
          {
            text:"requestUploadImage button",
            type:'requestUploadImage',
          },
        ]
      ])
  }

}
