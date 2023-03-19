import {ApiBotCommand, ApiBotInfo, ApiBotMenuButton} from "../../api/types";

export class Bot{
  private bot: ApiBotInfo | undefined
  constructor(bot:ApiBotInfo) {
    this.bot = bot
  }
  getBotInfo(){
    return this.bot;
  }

  setBotInfo(bot:ApiBotInfo){
    this.bot = bot;
  }
  static format(bot:{id:string,description:string,commands?:ApiBotCommand[],menuButton:ApiBotMenuButton}):ApiBotInfo{
    return {
      "botId": bot.id,
      "description": bot.description,
      menuButton:bot.menuButton,
      commands:bot.commands
    }
  }
}

