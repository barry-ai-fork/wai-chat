import {USER_CONFIG} from './context';
import {ENV} from './env.js';
import {fetchWithTimeout} from "../share/utils";

// 发送消息到ChatGPT
export async function sendMessageToChatGPT(message:string, history:{role:string,content:string}[]) {
  try {
    const body = {
      model: 'gpt-3.5-turbo',
      ...USER_CONFIG.OPENAI_API_EXTRA_PARAMS,
      messages: [...(history || []), {role: 'user', content: message}],
    };
    console.log("sendMessageToChatGPT",body.model,body.messages)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    }).then((res) => res.json());
    if (resp.error?.message) {
      return [true,`OpenAI API error\n> ${resp.error.message}`];
    }
    return [false,resp.choices[0].message.content];
  } catch (e) {
    console.error(e);
    // @ts-ignore
    return [true,`invoke openai error, message : ${e.message}`];
  }
}

