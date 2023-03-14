import * as AuthController from "./controller/AuthController";
import AssetController from "./controller/AssetController";
import WsController,{ApiMsg} from "./controller/WsController";
import {initEnv, ENV, kv} from "./helpers/env";
import * as queryString from "query-string";
import {getCorsHeader, ResponseJson} from "./helpers/network";

addEventListener('fetch', async (event) => {
  initEnv(global);
	// @ts-ignore
	event.respondWith(handleEvent(event));
});

async function handleEvent(event:FetchEvent) {
  const {request} = event;
	const url = new URL(request.url);
  if(request.method === "OPTIONS"){
    return new Response("",{
      headers:{
        ...getCorsHeader()
      }
    })
  }
	if(url.pathname === "/ws"){
		return WsController(event);
	}

  if(url.pathname === "/api/msg"){
    return ApiMsg(request);
  }

  if(url.pathname === "/auth/login"){
    return await AuthController.Login(request);
  }
  if(url.pathname === "/auth/reg"){
    return await AuthController.Reg(request);
  }
  if(url.pathname === "/auth/github/callback"){
    return await AuthController.GithubCallback(request);
  }
  if(url.pathname === "/auth/github"){
    return await AuthController.GithubRedirect(request);
  }
  if(url.pathname === "/auth/google/callback"){
    return await AuthController.GoogleCallback(request);
  }
  if(url.pathname === "/auth/google"){
    return await AuthController.GoogleRedirect(request);
  }

  if(url.pathname === "/auth/token"){
    return await AuthController.Token(request);
  }

  if(url.pathname.startsWith("/me")){
    return await AuthController.Me(request);
  }
  if(url.pathname.startsWith("/version")){
    return ResponseJson({
      v:"1.0.1",
    })
  }
  return new Response("",{
    status: 302,
    headers: {
      location: `${ENV.FRONTEND_URL}`,
    },
  })
}
