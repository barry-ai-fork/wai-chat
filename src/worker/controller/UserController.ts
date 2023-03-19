import {ENV} from "../helpers/env";
import { User } from "../share/User";
import {Bot} from "../share/Bot";
import {Chat} from "../share/Chat";

export function getInitSystemBots(){
  const {USER_ID_CHATGPT,USER_ID_BOT_FATHER,USER_ID_BOT_DEV} = ENV;
  return [
    {
      id:USER_ID_BOT_DEV,
      menuButton:{
        "type": "commands"
      },
      commands:[
        {
          "botId": USER_ID_BOT_DEV,
          "command": "start",
          "description": "Start Chat"
        }
      ],
      first_name:"Dev Center",
      user_name:"Dev",
      isPremium:true,
      description:"Dev"
    },
    {
      id:USER_ID_CHATGPT,
      menuButton:{
        "type": "commands"
      },
      commands:[
        {
          "botId": USER_ID_CHATGPT,
          "command": "start",
          "description": "Start Chat"
        },
        {
          "botId": USER_ID_CHATGPT,
          "command": "history",
          "description": "获取当前有效Prompt和对话的历史记录"
        },
        {
          "botId": USER_ID_CHATGPT,
          "command": "clear",
          "description": "清除当前有效Prompt和对话的历史记录"
        }
      ],
      first_name:"Chat Gpt",
      user_name:"ChatGpt",
      isPremium:true,
      description:"ChatGPT是基于GPT（Generative Pre-trained Transformer）模型的聊天机器人，可以进行智能对话和自动生成文章。ChatGPT通过深度学习技术，对大量文本进行学习，并可生成符合上下文的语句，从而能够进行更加人性化的对话。"
    },
    {
      id:USER_ID_BOT_FATHER,
      menuButton:{
        "type": "commands"
      },
      commands:[
        {
          "botId": USER_ID_BOT_FATHER,
          "command": "start",
          "description": "Start Chat"
        }
      ],
      first_name:"Bot Father",
      user_name:"BotFather",
      isPremium:true,
      description:"BotFather是主宰所有机器人的机器人。使用它可以创建新的机器人账户和管理已有的机器人。"
    }
  ]

}
export let initSystemBot_down = false;
export async function initSystemBot(bots:any[],force?:boolean){
  if(!force && initSystemBot_down){
    return;
  }
  initSystemBot_down = true;
  for (let i = 0; i < bots.length; i++) {
    const {id,first_name,user_name,isPremium,description,commands,menuButton} = bots[i]
    let user = await User.getFromCache(id)
    if(!user){
      const bot = new Bot(Bot.format({
        id,
        menuButton,
        commands,
        description
      }))
      const user = new User(User.format({
        id,
        first_name,
        user_name,
        isPremium,
        type:"userTypeBot",
      },bot.getBotInfo(),description));
      await user.save()
      const chat = new Chat(Chat.format({
        id,
        title:first_name,
      }))
      await chat.save();
    }
  }
}


