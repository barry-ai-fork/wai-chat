import MsgDispatcher from "./MsgDispatcher";
import {ApiBotInfo, ApiKeyboardButtons, ApiMessage} from "../../api/types";
import {UserIdFirstBot} from "../setting";
import {GlobalState} from "../../global/types";
import {showModalFromEvent} from "../share/utils/modal";
import {getActions} from "../../global";
import {currentTs} from "../share/utils/utils";

export default class MsgCommandChatLab{
  private chatId: string;
  private botInfo: ApiBotInfo;
  constructor(chatId:string,botInfo:ApiBotInfo) {
    this.chatId = chatId
    this.botInfo = botInfo;
  }
  static getInlineButtonsDemo():ApiKeyboardButtons{
    return [

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
    ]
  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    switch (data){
      case `${chatId}/lab/PromptDemo`:
        const {cn} = require('./prompts.json')
        for (let i = 0; i < cn.length; i++) {
          const row = cn[i][1]
          await MsgDispatcher.newTextMessage(chatId,undefined,row)
        }
        break
      case `${chatId}/lab/InlineButs`:
        await MsgDispatcher.newTextMessage(chatId,undefined,"",MsgCommandChatLab.getInlineButtonsDemo())
        break
      case `${chatId}/lab/testMsg`:
        const {value} = await showModalFromEvent({
          title: "输入JSON 格式的 msg", type: "singleInput"
        })
        try {
          if(value){
            const testMsg = async (value:string)=>{
              const message:ApiMessage = JSON.parse(value);
              message.chatId = chatId;
              message.id = await MsgDispatcher.genMsgId();
              message.isOutgoing = false
              message.senderId = chatId
              message.date = currentTs()
              await MsgDispatcher.newMessage(chatId,message.id,message)
            }
            await testMsg(value);
          }
        }catch (e){
          getActions().showNotification({
            message:"解析失败"
          })
        }
        break
    }
  }
  async lab(){
    const messageId = await MsgDispatcher.genMsgId();
    return await MsgDispatcher.newTextMessage(this.chatId,messageId,"welcome",[
      [
        {
          data:`${this.chatId}/lab/testMsg`,
          text:"Test Msg",
          type:"callback"
        },
      ],
      [
        {
          data:`${this.chatId}/lab/InlineButs`,
          text:"InlineButs Demo",
          type:"callback"
        },
      ],
        // [
        //   {
        //     data:`${this.chatId}/temp/PromptDemo`,
        //     text:"PromptDemo",
        //     type:"callback"
        //   },
        // ],
    ])
  }

}
