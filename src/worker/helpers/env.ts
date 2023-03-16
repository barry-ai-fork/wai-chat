import {HS256} from "worktop/jwt";
import CloudFlareKv from "../share/db/CloudFlareKv";
import Mnemonic from "../../lib/ptp/wallet/Mnemonic";
import Wallet from "../../lib/ptp/wallet/Wallet";

export const ENV:{
  IS_PROD: boolean,
  USER_ID_START: string,
  USER_ID_CHATGPT: string,
  TOKEN_EXPIRE_TIME_SEC: number,
  JWT_SECRET: string,
  GITHUB_CLIENT_ID: string,
  GITHUB_CLIENT_SECRET: string,
  GOOGLE_REDIRECT_PROD_URL: string,
  GOOGLE_CLIENT_ID : string,
  GOOGLE_CLIENT_SECRET : string,
  FRONTEND_URL : string,
  Access_Control_Allow_Origin : string,
  // OpenAI API Key
  OPENAI_API_KEY: string,
  // 为了避免4096字符限制，将消息删减
  AUTO_TRIM_HISTORY: boolean,
  // 最大历史记录长度
  MAX_HISTORY_LENGTH: number,
} = {
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
  FRONTEND_URL : "http://localhost:1234/",
  Access_Control_Allow_Origin : "*",
  // OpenAI API Key
  OPENAI_API_KEY: "",
  // 为了避免4096字符限制，将消息删减
  AUTO_TRIM_HISTORY: false,
  // 最大历史记录长度
  MAX_HISTORY_LENGTH: 20,
};

export let kv:CloudFlareKv;
//@ts-ignore
export let jwt =HS256({key:global.JWT_SECRET});

export function initEnv(env:Record<string, any>) {
  for (const key in ENV) {
    if (env[key] !== undefined) {
      // @ts-ignore
      ENV[key] = env[key];
    }
  }
  kv = new CloudFlareKv();
  kv.init(env.DATABASE)
}
