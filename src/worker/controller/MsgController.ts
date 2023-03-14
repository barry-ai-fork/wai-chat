import {stringToBuffer} from "../helpers/buffer";
import {DATABASE,ENV} from "../helpers/env";
import {sendMessageToChatGPT} from "../helpers/openai";


export async function sendMsg(dataJson,user_id,websocket){
  const msg = dataJson.data.msg
  let msgId = await DATABASE.get(`msg_incr_${user_id}`)
  const msg_text = msg.content.text.text;
  const chatId = msg.chatId;
  console.log("handleSendMsg",{dataJson,user_id,msgId,msg_text},JSON.stringify(msg.content))

  if(!msgId){
    msgId = 10000;
  }else{
    msgId = parseInt(msgId) + 1;
  }
  await DATABASE.put(`msg_incr_${user_id}`,msgId.toString())
  const localMsgId = msg.id;
  msg.id = msgId;
  const res = {
    seq_num:0,
    action:"updateMessageSendSucceeded",
    data:{
      localMsgId,
      msg
    }
  }
  // console.log(res,websocket);
  if(websocket){
    websocket.send(stringToBuffer(JSON.stringify(res)))

    if(chatId != user_id){
      if(chatId === ENV.USER_ID_CHATGPT){
        if(msg_text.indexOf("/") === -1){
          const newMsgId = res.data.msg.id+1
          await DATABASE.put(`msg_incr_${user_id}`,(newMsgId).toString())
          res.data.localMsgId = null
          res.action = "newMessage";
          res.data.msg.senderId = msg.chatId;
          res.data.msg.id = newMsgId
          res.data.msg.isOutgoing = false

          res.data.msg.content = {
            text:{
              text:"thinking..."
            }
          }

          websocket.send(stringToBuffer(JSON.stringify(res)))

          setTimeout(async ()=>{
            const reply = await sendMessageToChatGPT(msg_text,[]);
            console.log(reply)

            res.data.msg.content = {
              text:{
                text:reply
              }
            }
            websocket.send(stringToBuffer(JSON.stringify(res)))
          },200)
        }

      }else{
        await DATABASE.put(`msg_incr_${user_id}`,(res.data.msg.id+1).toString())
        setTimeout(async ()=>{
          res.action = "newMessage";
          res.data.localMsgId = null
          res.data.msg.senderId = msg.chatId;
          res.data.msg.id = res.data.msg.id + 1
          res.data.msg.isOutgoing = false
          res.data.msg.content = {
            text:{
              text:"python ```hello world```"
            }
          }
          websocket.send(stringToBuffer(JSON.stringify(res)))
        },200)
      }
    }


  }
  return res;
}
