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
import {User} from "../share/User";
import {TEXT_AI_THINKING} from "../setting";
import {ActionCommands} from "../../lib/ptp/protobuf/ActionCommands";
import {ERR} from "../../lib/ptp/protobuf/PTPCommon/types";

export async function msgHandler(pdu:Pdu,account:Account){
  switch (pdu.getCommandId()){
    case ActionCommands.CID_MsgListReq:
      const handleMsgListReq = async (pdu:Pdu)=>{
        const {lastMessageId,chatId} = MsgListReq.parseMsg(pdu);
        // console.log(payload)
        console.log("CID_MsgListReq",{chatId})
        const user_id = account.getUid();
        const res = {
          users:[],
          chats:[],
          repliesThreadInfos:[],
          messages:[]
        }
        if(user_id){
          const rows = await Msg.getMsgList(user_id,chatId,lastMessageId,true);
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
      const chatMsgIds = await Msg.getChatMsgIds(msgUpdateReq.user_id,msgUpdateReq.chat_id,[msgUpdateReq.msg_id])
      for (let i = 0; i < chatMsgIds.length; i++) {
        const msgUpdate = await Msg.getFromCache(msgUpdateReq.user_id,msgUpdateReq.chat_id,chatMsgIds[i])
        if(msgUpdate){
          msgUpdate.setMsgText(msgUpdateReq.text)
          await msgUpdate.save(true)
        }
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
  const msgSendByUser = new Msg(msg);
  const chatIsNotGroupOrChannel = Msg.getChatIsNotGroupOrChannel(chatId)
  let botInfo;
  if(chatIsNotGroupOrChannel){
    const chatUser = await User.getFromCache(chatId);
    botInfo = chatUser?.isBot() ? chatUser?.getUserInfo()!.fullInfo?.botInfo! : null
  }
  msgSendByUser.init(user_id,chatId,!!botInfo,user_id)
  await msgSendByUser.genMsgId();
  await msgSendByUser.send("updateMessageSendSucceeded",{localMsgId:id},seq_num)

  msgSendByUser.save().catch(console.error)
  if(botInfo){
    const msgModelBotReply = new Msg();
    msgModelBotReply.init(user_id,chatId,true,chatId)
    if(msgSendByUser.getMsgText()){
      if(msgSendByUser.getMsgText().indexOf("/") === 0){
        switch (msgSendByUser.getMsgText()){
          case "/start":
            await msgModelBotReply.sendText(botInfo['description']!)
            break
          // case "/clear":
          //   await msgSendByUser.clearAiMsgHistory();
          // case "/history":
          //   const history = await msgSendByUser.getAiMsgHistory();
          //   await msgModelBotReply.sendText(`===\nHistory\n==============\n\n${history.map(({role,content})=>{
          //     return `${role === "user" ? "\n>" : "<"}:${content}`
          //   }).join("\n")}`)
          //   break
          default:
            return;
        }
      }else{
        if(botInfo.isChatGpt){
          // const history = await msgSendByUser.getAiMsgHistory();
          const history: { role: string; content: string; }[] = [];
          await msgModelBotReply.sendText(TEXT_AI_THINKING);
          let [error,reply] = await sendMessageToChatGPT(msgSendByUser.getMsgText(),history);
          if(!error){
            reply = reply.replace("```html","```");
            console.log(reply)
            // msgModelBotReply.aiRole = AiChatRole.ASSISTANT;
            // msgSendByUser.aiRole = AiChatRole.USER;
            await msgModelBotReply.sendText(reply,"updateMessageSendSucceeded",{
              date:Msg.genMsgDate()
            })
          }else{
            msgModelBotReply.hasSent = false
          }
        }
      }
      msgModelBotReply.save().catch(console.error)
    }
  }

}
