import {stringToBuffer} from "../../helpers/buffer";
import {decode} from "worktop/buffer";
import {getAuthUser} from "../AuthController";
import * as utils from "worktop/utils";
import {AuthTokenForm, AuthUser} from "../../types";
import {ResponseJson} from "../../helpers/network";
import {sendMsg} from "../MsgController";
import {loadChats} from "../ChatController";
import {createBot, getUser} from "../UserController";
import {reply} from "worktop/response";
import {kv, jwt,ENV} from "../../helpers/env";

export const UserWsMap:Record<string, WebSocket> = {};
export const WsUserMap:Record<WebSocket, AuthUser> = {};

const getTokenAuthUser = async (msg)=>{
  const {token} = msg.data;
  const claims = await jwt.verify(token);
  const user_id = claims.iss;
  return JSON.parse(await kv.get(`U_${user_id}`));
}

async function handleSession(websocket: WebSocket) {
  // @ts-ignore
  websocket.accept();
  websocket.addEventListener('message', async ({ data }) => {
    let seq_num = 0;
    try {
      const dataJson = JSON.parse(data);
      switch (dataJson.action){
        case "login":
          console.log("on login",dataJson)
          let authUser;
          try{
            authUser = await getTokenAuthUser(dataJson)
            if(!authUser){
              throw new Error("auth is null")
            }
          }catch (e){
            console.error(e)
            websocket.send(JSON.stringify({
              action:dataJson.action,
              seq_num:dataJson.seq_num || 0,
              err_msg:"token is invalid",
              err:400,
              data:{
              }
            }));
            return;
          }
          UserWsMap[authUser.user_id] =  websocket;
          WsUserMap[websocket] = authUser;
          websocket.send(JSON.stringify({
            action:dataJson.action,
            seq_num:dataJson.seq_num || 0,
            data:{
              currentUser: await getUser(authUser.user_id,true),
              currentUserId: authUser.user_id
            }
          }));
          break
        default:
          if(dataJson.action === "sendMsg"){
            console.log(data)
            console.log("msg text",dataJson.data.msg.content.text.text)
          }
          if(WsUserMap[websocket]){
            await _ApiMsg(dataJson,WsUserMap[websocket].user_id,websocket)
          }else{
            websocket.send(JSON.stringify({
              action:dataJson.action,
              seq_num:dataJson.seq_num || 0,
              err_msg:"not found user",
              data:{ }
            }));
          }
          break
      }
    }catch (e){
      console.error(e)
      websocket.send(stringToBuffer(JSON.stringify({
        err_msg:"system error",
        seq_num
      })));
    }
  });

  websocket.addEventListener('close', async evt => {
    if(WsUserMap[websocket] && UserWsMap[WsUserMap[websocket].user_id]){
      console.log("[close] delete user:",WsUserMap[websocket].user_id);
      delete UserWsMap[WsUserMap[websocket].user_id];
    }else{
      console.log("[close]");
    }
  });
}

async function websocketHandler(req: Request) {
  const upgradeHeader = req.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }
  // @ts-ignore
  const [webSocket, server] = Object.values(new WebSocketPair());
  // @ts-ignore
  await handleSession(server);
  const status = 101;
  // @ts-ignore
  return new Response(null, {status,webSocket});
}

export default async function (event:FetchEvent){
  return await websocketHandler(event.request);
}

export async function _ApiMsg(dataJson:Record<string, any>,user_id:string,websocket?:WebSocket){
  const {action,seq_num} = dataJson;
  let result = null
  switch (action){
    case "loadChats":
      const chat_gpt = await createBot(ENV.USER_ID_CHATGPT,"ChatGPT","ChatGPT");
      result = await loadChats(dataJson,user_id,websocket)
      break
    case "super_init":
      result = await super_init(dataJson,user_id,websocket)
      break
    case "sendMsg":
      result = await sendMsg(dataJson,user_id,websocket)
      break
  }
  console.log({action,result})
  return result
}


async function super_init(dataJson,user_id,websocket){
  const res = {
    seq_num:dataJson.seq_num || 0,
    action:dataJson.action,
    data:{
      // chat_gpt
    }
  }
  return res;
}
export async function ApiMsg(request:Request){
  const authUser = await getAuthUser(request);
  if(!authUser){
    return reply(400, 'not found user');
  }
  if(!authUser.user_id){
    return authUser;
  }
  let input;
  try {
    input = await utils.body<AuthTokenForm>(request);
  } catch (err) {
    return ResponseJson({
      err_msg:"Error parsing request body"
    })
  }

  const result = await _ApiMsg(await input,authUser.user_id,UserWsMap[authUser.user_id] || undefined);
  return ResponseJson(result);
}
