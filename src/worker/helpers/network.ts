import {ENV} from "./env";

export function ResponseJson(result:object,status = 200) {
  const {FRONTEND_AUTH_CALLBACK_URL} = ENV
  return new Response(JSON.stringify(result), {
    status,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      "Access-Control-Allow-Origin":FRONTEND_AUTH_CALLBACK_URL,
      "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type, Authorization, Accept",
      "Access-Control-Allow-Credentials":"true",
    },
  });
}

export function parseQueryFromUrl(urlStr: string): { url: URL; query: Record<string, string> } {
  const replacedUrl = urlStr.replace(/#/g, '?');
  const url = new URL(replacedUrl);
  const query = Array.from(url.searchParams.entries()).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value
    }),
    {}
  );

  return { url, query };
}
