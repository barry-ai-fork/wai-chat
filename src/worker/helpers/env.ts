import {HS256} from "worktop/jwt";

export const ENV = {
  IS_PROD: true,
  USER_ID_START: "623415",
  USER_ID_CHATGPT: "10001",
  TOKEN_EXPIRE_TIME_SEC: 3600,
  JWT_SECRET: "",
  GITHUB_CLIENT_ID: "",
  GITHUB_CLIENT_SECRET: "",
  GOOGLE_REDIRECT_PROD_URL: "http://localhost:1235/auth/google/callback",
  GOOGLE_CLIENT_ID : "",
  GOOGLE_CLIENT_SECRET : "",
  FRONTEND_AUTH_CALLBACK_URL : "http://localhost:1234/",
  Access_Control_Allow_Origin : "*",
  // OpenAI API Key
  OPENAI_API_KEY: "",

};

export let DATABASE = null;
//@ts-ignore
export let jwt =HS256({key:global.JWT_SECRET});

export function initEnv(env) {
  DATABASE = env.DATABASE;
  for (const key in ENV) {
    if (env[key] !== undefined) {
      switch (typeof ENV[key]) {
        case 'number':
          ENV[key] = parseInt(env[key]) || ENV[key];
          break;
        case 'boolean':
          ENV[key] = (env[key] || 'false') === 'true';
          break;
        case 'object':
          if (Array.isArray(ENV[key])) {
            ENV[key] = env[key].split(',');
          } else {
            ENV[key] = env[key];
          }
          break;
        default:
          ENV[key] = env[key];
          break;
      }
    }
  }
}
