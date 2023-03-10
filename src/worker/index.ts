import * as AuthController from "./controller/AuthController";
import AssetController from "./controller/AssetController";
import WsController from "./controller/WsController";
import UserController from "./controller/UserController";

addEventListener('fetch', (event) => {
  // @ts-ignore
  console.log("JWT_SECRET",JWT_SECRET)
	// @ts-ignore
	event.respondWith(handleEvent(event));
});

async function handleEvent(event:FetchEvent) {
  const {request} = event;
	const url = new URL(request.url);
  if(request.method === "OPTIONS"){
    return new Response("",{
      headers:{
        "Access-Control-Allow-Origin":"http://localhost:1234",
        "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":"Content-Type, Authorization, Accept",
        "Access-Control-Allow-Credentials":"true",
      }
    })
  }
	if(url.pathname === "/ws"){
		return WsController(event);
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

  if(url.pathname.startsWith("/user")){
    return await UserController(request);
  }

  if(url.pathname.startsWith("/me")){
    return await AuthController.Me(request);
  }
  return AssetController(event);
}
