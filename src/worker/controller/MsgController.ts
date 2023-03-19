import {ENV} from "../helpers/env";
import {sendMessageToChatGPT} from "../helpers/openai";
import {Pdu} from "../../lib/ptp/protobuf/BaseMsg";
import Account from "../share/Account";
import {
  MsgDeleteReq,
  MsgDeleteRes,
  MsgListReq,
  MsgListRes,
  MsgUpdateReq,
  MsgUpdateRes,
  SendReq
} from "../../lib/ptp/protobuf/PTPMsg";
import {Msg} from "../share/Msg";
import {AiChatRole} from "../types";
import {User} from "../share/User";
import {TEXT_AI_THINKING} from "../setting";
import {ActionCommands} from "../../lib/ptp/protobuf/ActionCommands";
import {ERR} from "../../lib/ptp/protobuf/PTPCommon";

export async function msgHandler(pdu:Pdu,account:Account){
  switch (pdu.getCommandId()){
    case ActionCommands.CID_MsgListReq:
      const handleMsgListReq = async (pdu:Pdu)=>{
        const {payload} = MsgListReq.parseMsg(pdu);
        // console.log(payload)
        const  {chat,addOffset,limit,threadId} = JSON.parse(payload)
        const {id:chatId} = chat
        console.log("CID_MsgListReq",{chatId})
        const user_id = account.getUid();
        const res = {
          users:[],
          chats:[],
          repliesThreadInfos:[],
          messages:[]
        }
        if(user_id){
          const msgObj = new Msg({chatId,user_id});
          const rows = await msgObj.getAllMsgList();
          // console.log(rows);
          rows.forEach((msg:any)=>{
            // @ts-ignore
            return res.messages.push(msg.msg);
          })
        }
        account.sendPdu(new MsgListRes({
          err:ERR.NO_ERROR,
          payload:JSON.stringify(res)
        }).pack(),pdu.getSeqNum())
      }
      await handleMsgListReq(pdu);
      return
    default:
      break
  }
  if(!account.getUid()){
    return;
  }
  switch (pdu.getCommandId()){
    case ActionCommands.CID_MsgUpdateReq:
      const msgUpdateReq = MsgUpdateReq.parseMsg(pdu);
      const msgUpdate = await Msg.getMsgFromCache(msgUpdateReq.user_id,msgUpdateReq.chat_id,msgUpdateReq.msg_id)
      if(msgUpdate){
        msgUpdate.setMsgText(msgUpdateReq.text)
        await msgUpdate.save()
      }
      account.sendPdu(new MsgUpdateRes({
        err:ERR.NO_ERROR
      }).pack(),pdu.getSeqNum())
      return
    case ActionCommands.CID_MsgDeleteReq:
      const msgDeleteReq = MsgDeleteReq.parseMsg(pdu);
      await Msg.deleteMsg(msgDeleteReq.user_id,msgDeleteReq.chat_id,msgDeleteReq.msg_ids);
      account.sendPdu(new MsgDeleteRes({
        err:ERR.NO_ERROR
      }).pack(),pdu.getSeqNum())
      return
    default:
      break
  }

  const sendReq = SendReq.parseMsg(pdu);
  const seq_num = pdu.getSeqNum();
  const {payload} = sendReq;
  const {msg} = JSON.parse(payload)
  const {chatId,id} = msg;
  const user_id = account.getUid()!;
  const msgModel = new Msg({user_id,chatId,senderId:user_id});
  msgModel.setMsg({
    ...msg,
    senderId:user_id,
    isOutgoing:true,
    id:await msgModel.incrMsgId()
  });

  await msgModel.send("updateMessageSendSucceeded",{localMsgId:id},seq_num)
  const chatUser = await User.getFromCache(chatId);
  const user = new User(User.format({id:user_id}))
  const botInfo = chatUser?.isBot() ? chatUser?.getUserInfo()!.fullInfo?.botInfo! : null

  if(botInfo){
    setTimeout(async ()=>{
      if(msgModel.getMsgText()){
        if(msgModel.getMsgText().indexOf("/") === 0){
          msgModel.save().catch(console.error)
          await user.updateChatId(chatId,msgModel.msg?.id!)
          const msgModelBotCmdReply = new Msg({user_id,chatId,senderId:chatId});
          switch (msgModel.getMsgText()){
            case "/start":
              await msgModelBotCmdReply.sendText(botInfo['description']!,"updateMessageSendSucceeded",{})
              break
            case "/clear":
              await msgModel.clearAiMsgHistory();
            case "/history":
              const history = await msgModel.getAiMsgHistory();
              await msgModelBotCmdReply.sendText(`===\nHistory\n==============\n\n${history.map(({role,content})=>{
                return `${role === "user" ? "\n>" : "<"}:${content}`
              }).join("\n")}`)
              break
            default:
              return;
          }
          msgModelBotCmdReply.save().catch(console.error)
          await user.updateChatId(chatId,msgModelBotCmdReply.msg?.id!)
        }else{
          if(chatId === ENV.USER_ID_CHATGPT){
            const history = await msgModel.getAiMsgHistory();
            const msgModelBotReply = new Msg({user_id,chatId,senderId:chatId});
            await msgModelBotReply.sendText(TEXT_AI_THINKING);
            const [error,reply] = await sendMessageToChatGPT(msgModel.getMsgText(),history);
            if(!error){
              msgModelBotReply.aiRole = AiChatRole.ASSISTANT;
              msgModel.aiRole = AiChatRole.USER;
            }

            msgModel.save().catch(console.error);
            msgModelBotReply.sendText(reply,"updateMessageSendSucceeded",{},msgModelBotReply.msg?.id)
            msgModelBotReply.save().catch(console.error)
            await user.updateChatId(chatId,msgModelBotReply.msg?.id!)
          }else{
            msgModel.save().catch(console.error)
            await user.updateChatId(chatId,msgModel.msg?.id!)
          }
        }
      }
    },500)
  }else{
    msgModel.save().catch(console.error)
    await user.updateChatId(chatId,msgModel.msg?.id!)
  }
}
