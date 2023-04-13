import MsgDispatcher from "./MsgDispatcher";
import {ApiBotInfo, ApiKeyboardButtons, ApiMessage} from "../../api/types";
import {DEFAULT_BOT_COMMANDS, UserIdCnPrompt, UserIdEnPrompt, UserIdFirstBot} from "../setting";
import {GlobalState} from "../../global/types";
import {showModalFromEvent} from "../share/utils/modal";
import {getActions, getGlobal} from "../../global";
import {currentTs} from "../share/utils/utils";
import {DEBUG} from "../../config";
import {selectChatMessage} from "../../global/selectors";

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
  static async createChat(botId:string,data:string,msgId:number){
    const t = data.split("/")
    const chatId = t[0]
    const title = t[3]
    const message = selectChatMessage(getGlobal(),chatId,msgId)
    if(message){
      const prompt = message.content.text!.text
      getActions().createChat({title,promptInit:prompt})
    }


  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    const {cn,en} = require('./prompts.json')
    const userIds = Object.keys(global.users.byId)

    if(data.startsWith(`${chatId}/createChat/cn`)){
      await MsgCommandChatLab.createChat(UserIdCnPrompt,data,messageId)
      return
    }
    if(data.startsWith(`${chatId}/createChat/en`)){
      await MsgCommandChatLab.createChat(UserIdEnPrompt,data,messageId)
      return
    }
    switch (data){
      case `${chatId}/lab/createEnPrompt`:
        if(UserIdEnPrompt && userIds.includes(UserIdEnPrompt)){
          getActions().showNotification({message:`${UserIdEnPrompt} 已存在`})
          return
        }
        getActions().createChat({id:UserIdEnPrompt,title:"英文Prompt大全"})
        const msg0 = await MsgDispatcher.newTextMessage(chatId,undefined,"正在创建 英文Prompt大全...")
        setTimeout(async ()=>{
          en.reverse();
          for (let i = 0; i < en.length; i++) {
            const desc = en[i][1]
            const title = en[i][0]
            if(desc){
              await MsgDispatcher.newTextMessage(UserIdEnPrompt,undefined,desc,[
                [
                  {
                    text:"创建Gpt聊天",
                    type:"callback",
                    data:`${UserIdEnPrompt}/createChat/en/${title}`
                  }
                ]
              ])
              await MsgDispatcher.updateMessage(chatId,msg0.id,{
                ...msg0,
                content:{
                  text:{
                    text:`正在创建 英文Prompt大全... ${i+1}/${en.length}`
                  }
                }
              })
            }

          }
        },500)
        break
      case `${chatId}/lab/createCnPrompt`:
        if(UserIdCnPrompt && userIds.includes(UserIdCnPrompt)){
          getActions().showNotification({message:`${UserIdCnPrompt} 已存在`})
          return
        }
        getActions().createChat({id:UserIdCnPrompt,title:"中文Prompt大全"})
        const msg1 = await MsgDispatcher.newTextMessage(chatId,undefined,"正在创建 中文Prompt大全...")
        setTimeout(async ()=>{
          cn.reverse();
          for (let i = 0; i < cn.length; i++) {
            const desc = cn[i][1]
            const title = cn[i][0]
            if(desc){
              await MsgDispatcher.newTextMessage(UserIdCnPrompt,undefined,desc,[
                [
                  {
                    text:"创建Gpt聊天",
                    type:"callback",
                    data:`${UserIdCnPrompt}/createChat/cn/${title}`
                  }
                ]
              ])
              await MsgDispatcher.updateMessage(chatId,msg1.id,{
                ...msg1,
                content:{
                  text:{
                    text:`正在创建 中文Prompt大全... ${i+1}/${cn.length}`
                  }
                }
              })
            }

          }
        },500)
        break
      case `${chatId}/lab/InlineButs`:
        await MsgDispatcher.newTextMessage(chatId,undefined,"",MsgCommandChatLab.getInlineButtonsDemo())
        break

      case `${chatId}/lab/dumpUsers`:
        if(DEBUG){
          await MsgDispatcher.newCodeMessage(chatId,undefined,JSON.stringify(global.messages.byChatId[chatId],null,2))
          // await MsgDispatcher.newCodeMessage(chatId,undefined,JSON.stringify(global.messages.byChatId["1111"],null,2))
          // global = getGlobal()
          // getActions().updateGlobal({
          //   ...global,
          //   messages:{
          //     ...global.messages,
          //     byChatId:{
          //       ...global.messages.byChatId,
          //       ["1111"]:{
          //         ...global.messages.byChatId["1111"],
          //         threadsById:{
          //           "-1":{
          //             ...global.messages.byChatId["1111"].threadsById["-1"],
          //             lastScrollOffset:0
          //           }
          //         }
          //       }
          //     }
          //   }
          // })
        }
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
    return await MsgDispatcher.newTextMessage(this.chatId,messageId,"实验室",[
      [
        {
          data:`${this.chatId}/lab/createCnPrompt`,
          text:"中文Prompt大全",
          type:"callback"
        },
        {
          data:`${this.chatId}/lab/createEnPrompt`,
          text:"英文Prompt大全",
          type:"callback"
        },
      ],
      // [
      //   {
      //     data:`${this.chatId}/lab/dumpUsers`,
      //     text:"DumpUsers",
      //     type:"callback"
      //   },
      // ],
      // [
      //   {
      //     data:`${this.chatId}/lab/InlineButs`,
      //     text:"InlineButs Demo",
      //     type:"callback"
      //   },
      // ],
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
