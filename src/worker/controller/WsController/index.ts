import {bufferToString, stringToBuffer} from "../../helpers/buffer";

let count = 0;

async function handleSession(websocket: WebSocket) {
  // @ts-ignore
  websocket.accept();
  websocket.addEventListener('message', async ({ data }) => {
    const msg = bufferToString(data);
    if (msg === 'CLICK') {
      count += 1;
      websocket.send(stringToBuffer(JSON.stringify({ count, tz: new Date() })));
    } else {
      // An unknown message came into the server. Send back an error message
      websocket.send(stringToBuffer(JSON.stringify({ error: 'Unknown message received', tz: new Date() })));
    }
  });

  websocket.addEventListener('close', async evt => {
    console.log(evt);
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
