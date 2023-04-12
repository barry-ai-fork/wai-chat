import MsgDispatcher from "./MsgDispatcher";
import {currentTs} from "../share/utils/utils";
import {ApiBotInfo, ApiMessage} from "../../api/types";
import {GlobalState} from "../../global/types";
import {getGlobal, setGlobal} from "../../global";
import {selectUser} from "../../global/selectors";
import {updateUser} from "../../global/reducers";
import {DEFAULT_PROMPT} from "../setting";
import {callApiWithPdu} from "./utils";
import {StopChatStreamReq} from "../../lib/ptp/protobuf/PTPOther";

export default class MsgCommandChatGpt{
  private chatId: string;
  private botInfo: ApiBotInfo;
  constructor(chatId:string,botInfo:ApiBotInfo) {
    this.chatId = chatId
    this.botInfo = botInfo;
  }
  async start(){
    const messageId = await MsgDispatcher.genMsgId();
    const {chatId} = this
    const message = {
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:"welcome"
        }
      },
    }
    MsgDispatcher.newMessage(chatId,messageId,message)
    return message
  }
  async initPrompt(){
    const messageId = await MsgDispatcher.genMsgId();
    const {chatId} = this
    const init_system_content = this.botInfo.aiBot?.chatGptConfig?.init_system_content || DEFAULT_PROMPT
    const message:ApiMessage = {
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:`当前 上下文 prompt:\n ${init_system_content?init_system_content:"未设置"}`
        }
      },
      inlineButtons:[
        [
          {
            text:"点击修改",
            type:"callback",
            data:`${chatId}/init_system_content`
          }
        ]
      ]
    }
    MsgDispatcher.newMessage(chatId,messageId,message)
    return message
  }
  async apiKey(){
    const messageId = await MsgDispatcher.genMsgId();
    const {chatId} = this
    const api_key = this.botInfo.aiBot?.chatGptConfig?.api_key
    const message:ApiMessage = {
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:`当前 /apiKey:\n ${api_key?api_key:"未设置"}`
        }
      },
      inlineButtons:[
        [
          {
            text:"点击修改",
            type:"callback",
            data:`${chatId}/apiKey`
          }
        ]
      ]
    }
    MsgDispatcher.newMessage(chatId,messageId,message)
    return message
  }
  async aiModel(){
    const messageId = await MsgDispatcher.genMsgId();
    const {chatId} = this
    const model = this.botInfo.aiBot?.chatGptConfig?.config?.model
    const message:ApiMessage = {
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:`当前模型:【${model}】`
        }
      },
    }
    MsgDispatcher.newMessage(chatId,messageId,message)
    return message
  }
  async enableAi(){
    const messageId = await MsgDispatcher.genMsgId();
    const {chatId} = this
    const isEnable = !!this.botInfo.aiBot?.enableAi
    const message:ApiMessage = {
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:`当前状态:【${isEnable ? "开启" : "关闭"}】，修改请点击下面按钮:`
        }
      },
      inlineButtons:[
        [
          {
            text:isEnable ? "关闭" : "开启",
            type:"callback",
            data:`${chatId}/enableAi/${isEnable ? "0":"1"}`
          }
        ]
      ]
    }
    MsgDispatcher.newMessage(chatId,messageId,message)
    return message
  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    switch (data){
      case `${chatId}/requestChatStream/stop`:
        MsgDispatcher.updateMessage(chatId,messageId, {
          inlineButtons:[
            [
              {
                text: "已停止输出",
                type: "unsupported"
              }
            ]
          ]
        })
        await callApiWithPdu(new StopChatStreamReq({
          chatId:parseInt(chatId),
          msgId:messageId
        }).pack())
        break
      case `${chatId}/init_system_content`:
        const init_system_content = prompt("请输入")
        if(init_system_content){
          global = getGlobal();
          const user = selectUser(global,chatId);
          global = updateUser(global,chatId,{
            ...user,
            fullInfo:{
              ...user?.fullInfo,
              botInfo:{
                ...user?.fullInfo?.botInfo!,
                aiBot:{
                  ...user?.fullInfo?.botInfo?.aiBot,
                  chatGptConfig:{
                    ...user?.fullInfo?.botInfo?.aiBot?.chatGptConfig,
                    init_system_content
                  }
                }
              }
            }
          })
          setGlobal(global)

          const message1 = {
            content:{
              text:{
                text:`当前 上下文 prompt:\n ${init_system_content?init_system_content:"未设置"}`
              }
            },
            inlineButtons:[
              [
                {
                  text:"点击修改",
                  type:"callback",
                  data:`${chatId}/apiKey`
                }
              ]
            ]
          }
          // @ts-ignore
          MsgDispatcher.newMessage(chatId,messageId,message1)
        }
        break;
      case `${chatId}/apiKey`:
        const api_key = prompt("请输入")
        if(api_key){
          global = getGlobal();
          const user = selectUser(global,chatId);
          global = updateUser(global,chatId,{
            ...user,
            fullInfo:{
              ...user?.fullInfo,
              botInfo:{
                ...user?.fullInfo?.botInfo!,
                aiBot:{
                  ...user?.fullInfo?.botInfo?.aiBot,
                  chatGptConfig:{
                    ...user?.fullInfo?.botInfo?.aiBot?.chatGptConfig,
                    api_key
                  }
                }
              }
            }
          })
          setGlobal(global)
          const message2 = {
            content:{
              text:{
                text:`当前 /apiKey:\n ${api_key?api_key:"未设置"}`
              }
            },
            inlineButtons:[
              [
                {
                  text:"点击修改",
                  type:"callback",
                  data:`${chatId}/apiKey`
                }
              ]
            ]
          }
          // @ts-ignore
          MsgDispatcher.newMessage(chatId,messageId,message2)
        }

        break;
      case `${chatId}/enableAi/0`:
      case `${chatId}/enableAi/1`:
        const isEnable = data === `${chatId}/enableAi/1`;
        global = getGlobal();
        const user = selectUser(global,chatId);
        global = updateUser(global,chatId,{
          ...user,
          fullInfo:{
            ...user?.fullInfo,
            botInfo:{
              ...user?.fullInfo?.botInfo!,
              aiBot:{
                ...user?.fullInfo?.botInfo?.aiBot,
                enableAi:isEnable
              }
            }
          }
        })
        setGlobal(global)
        MsgDispatcher.updateMessage(chatId,messageId,{
          content:{
            text:{
              text:`当前状态:【${isEnable ? "开启" : "关闭"}】，修改请点击下面按钮:`
            }
          },
          inlineButtons:[
            [
              {
                text:isEnable ? "关闭" : "开启",
                type:"callback",
                data:`${chatId}/enableAi/${isEnable ? "0":"1"}`
              }
            ]
          ]
        })
        break
    }
  }
}
