import WsController from "./controller/WsController";
import {ENV, initEnv} from "./helpers/env";
import {getCorsHeader, ResponseJson} from "./helpers/network";
import TestController from "./controller/TestController";
import TaskController from "./controller/TaskController";
import ProtoController from "./controller/ProtoController";

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

  if(url.pathname === "/proto" ){
    return ProtoController.dispatch(event.request)
  }

	if(url.pathname === "/test" ){
		return TestController(event.request);
	}

  if(url.pathname === "/task" ){
    return TaskController(event.request);
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
