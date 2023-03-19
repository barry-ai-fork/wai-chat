import {ResponseJson} from "../helpers/network";
import * as utils from "worktop/utils";
import {ENV, kv} from "../helpers/env";
import {RequestForm} from "../types";
import {Msg} from "../share/Msg";
import {getInitSystemBots, initSystemBot, initSystemBot_down} from "./UserController";
import {Chat} from "../share/Chat";
import {User} from "../share/User";

export default async function(request:Request){
  const TEST_TOKEN = ENV.TEST_TOKEN;
  const IS_PROD = ENV.IS_PROD;
  if(IS_PROD ){
    if(!TEST_TOKEN || request.headers.get("Authorization") !== `Bearer ${TEST_TOKEN}`){
      return ResponseJson({
        err_msg:"invalid token"
      })
    }
  }

  let input;
  try {
    input = await utils.body<RequestForm>(request);
  } catch (err) {
    return ResponseJson({
      err_msg:"Error parsing request body"
    })
  }
  //@ts-ignore
  const {action,payload} = await input
  const {auth_uid} = payload;
  switch (action){
    case "msg":
      const msgObj = new Msg({
        chatId: "3", senderId: "1", user_id: "2"
      });
      msgObj.setMsg({
        id:await msgObj.incrMsgId(),
        ...msgObj.formatMsg(),
        content:{
          text:{
            text:""
          }
        },
      });
      payload.msg = msgObj.msg;
      break

    case "reset":
      const {USER_ID_CHATGPT,USER_ID_BOT_FATHER,USER_ID_BOT_DEV} = ENV;
      await kv.delete(`U_${auth_uid}`)
      await kv.delete(`U_${auth_uid}`)

      await kv.delete(`U_${USER_ID_CHATGPT}`)
      await kv.delete(`C_${USER_ID_CHATGPT}`)

      await kv.delete(`U_${USER_ID_BOT_FATHER}`)
      await kv.delete(`C_${USER_ID_BOT_FATHER}`)

      await kv.delete(`U_${USER_ID_BOT_DEV}`)
      await kv.delete(`C_${USER_ID_BOT_DEV}`)
      break
    case "initSystemBot":
      await initSystemBot(getInitSystemBots(),true);
      const chatIds = User.getPublicBots();
      payload.chats = [];
      payload.users = [];

      for (let j = 0; j < chatIds.length; j++) {
        const id = chatIds[j];
        payload.chats.push((await Chat.getFromCache(id))?.getChatInfo())
        payload.users.push((await User.getFromCache(id))?.getUserInfo())
      }

      await User.init(auth_uid);
      payload.currentUser = (await User.getFromCache(auth_uid))?.getUserInfo();
      payload.chatFolder = await (await User.getFromCache(auth_uid))?.getChatFolder();
      break;
    case "loadChats":
      payload.payload = await User.loadChats(auth_uid);
      break
  }

  return ResponseJson({action,payload});
}

