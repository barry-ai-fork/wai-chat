import {ResponseJson} from "../helpers/network";
import * as utils from "worktop/utils";
import {ENV, kv} from "../helpers/env";
import {faker} from '@faker-js/faker';
import {createBot, getBot, getBotChat, getBotIds, initSystemBot, saveBotIds} from "./UserController";

type Form = {
  action:string,
  payload:any,
}

export default async function TestController(request:Request){
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
    input = await utils.body<Form>(request);
  } catch (err) {
    return ResponseJson({
      err_msg:"Error parsing request body"
    })
  }
  //@ts-ignore
  const {action,payload} = await input
  // const {auth_uid} = payload;
  switch (action){
    case "initSystemBot":
      await kv.delete(`BOT_PUB`)
      // await kv.delete(`BOT_${ENV.USER_ID_BOT_FATHER}`)
      await kv.delete(`BOT_${ENV.USER_ID_CHATGPT}`)
      await initSystemBot();
      payload.botIds = await getBotIds();
      payload.chats = [];
      payload.users = [];

      for (let j = 0; j < payload.botIds.length; j++) {
        const id = payload.botIds[j];
        payload.chats.push(await getBotChat(id))
        payload.users.push(await getBot(id))
      }
      break;
  }

  return ResponseJson({action,payload});
}

