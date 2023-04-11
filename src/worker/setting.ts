import {PbChatGptConfig_Type} from "../lib/ptp/protobuf/PTPCommon/types";

export const UserIdFirstBot = "1000";
export const NameFirstBot = "小W";
export const DEFAULT_CREATE_USER_BIO = '我是一个AI机器人'
export const DEFAULT_PROMPT = '你现在是一个优秀的前端开发工程师，请用中文回答我的问题。'
export const BOT_FOLDER_TITLE = '机器人'
export const BOT_FOLDER_ID = 1


export const ChatModelConfig:PbChatGptConfig_Type = {
  model: "gpt-3.5-turbo",
  temperature: 1,
  max_tokens: 2000,
  presence_penalty: 0,
}
export const DEFAULT_AI_CONFIG_COMMANDS = [
  {
    "botId": UserIdFirstBot,
    "command": "aiModel",
    "description": "设置AI模型"
  },
  {
    "botId": UserIdFirstBot,
    "command": "apiKey",
    "description": "设置apiKey"
  },
  {
    "botId": UserIdFirstBot,
    "command": "initPrompt",
    "description": "初始化上下文Prompt"
  },
  {
    "botId": UserIdFirstBot,
    "command": "enableAi",
    "description": "开启或者关闭AI"
  },
]
export const DEFAULT_BOT_COMMANDS = [
  {
    "botId": UserIdFirstBot,
    "command": "start",
    "description": "开始对话"
  },
  {
    "botId": UserIdFirstBot,
    "command": "reloadCommands",
    "description": "重载命令"
  },
  {
    "botId": UserIdFirstBot,
    "command": "setting",
    "description": "设置"
  },
  {
    "botId": UserIdFirstBot,
    "command": "clearHistory",
    "description": "清除历史记录"
  },
  {
    "botId": UserIdFirstBot,
    "command": "temp",
    "description": "Temp"
  },
]

export const CurrentUserInfo = {
  "id": "1",
  "accessHash": "",
  "firstName": "",
  "lastName": "",
  "canBeInvitedToGroup": false,
  "hasVideoAvatar": false,
  "isMin": false,
  "isPremium": false,
  "noStatus": true,
  "fullInfo": {
    "isBlocked": false,
    "noVoiceMessages": false,
    "bio": "",
  },
  "usernames": [
    {
      "username": "my-self",
      "isActive": true,
      "isEditable": true
    }
  ],
  "type": "userTypeBot",
  "phoneNumber": "",
  "avatarHash": "",
  "isSelf": true
}

export let LoadAllChats = {
  "users": [
    {...CurrentUserInfo},
    {
      "id": UserIdFirstBot,
      "fullInfo": {
        "isBlocked": false,
        "noVoiceMessages": false,
        "bio": DEFAULT_CREATE_USER_BIO,
        "botInfo": {
          "botId": UserIdFirstBot,
          "description": DEFAULT_CREATE_USER_BIO,
          aiType:"ChatGpt",
          "menuButton": {
            "type": "commands"
          },
          "commands": DEFAULT_BOT_COMMANDS
        }
      },
      bot:{
        chatGptConfig:{
          config:ChatModelConfig,
          api_key:"",
          init_system_content:DEFAULT_PROMPT,
          max_history_length:4,
        },
        enableAi:true,
      },
      "accessHash": "",
      "firstName": NameFirstBot,
      "lastName": "",
      "canBeInvitedToGroup": false,
      "hasVideoAvatar": false,
      "isMin": false,
      "isPremium": true,
      "noStatus": true,
      "usernames": [
        {
          "username": "first_bot",
          "isActive": true,
          "isEditable": true
        }
      ],
      "type": "userTypeBot",
      "phoneNumber": "",
      "avatarHash": "",
      "isSelf": false
    }
  ],
  "chats": [
    {
      "id": UserIdFirstBot,
      "title":  NameFirstBot,
      "type": "chatTypePrivate",
      "isMuted": false,
      "isMin": false,
      "hasPrivateLink": false,
      "isSignaturesShown": false,
      "isVerified": true,
      "isJoinToSend": true,
      "isJoinRequest": true,
      "isForum": false,
      "isListed": true,
      "settings": {
        "isAutoArchived": false,
        "canReportSpam": false,
        "canAddContact": false,
        "canBlockContact": false
      },
      "accessHash": ""
    }
  ],
  "chatFolders": [
    {
      "id": BOT_FOLDER_ID,
      "title": BOT_FOLDER_TITLE,
      "includedChatIds": [
        UserIdFirstBot
      ],
      "channels": false,
      "pinnedChatIds": [],
      "excludedChatIds": []
    }
  ],
  folderIds:[
    0,
    BOT_FOLDER_ID
  ],
  "draftsById": {},
  "replyingToById": {},
  "orderedPinnedIds": [],
}
export const TEXT_AI_THINKING = "..."
export const BYPASS_API = [
  "editChatFolder","sortChatFolders","deleteChatFolder",
  "requestWebView","uploadContactProfilePhoto",
  "sendMessage","editMessage","deleteMessages","downloadMedia","destroy","fetchMessages","answerCallbackButton",
  "uploadProfilePhoto","fetchChats","sendWithCallback","msgClientLogin","updateProfile","updateUsername"
]
export const MaxSyncUserToRemote = 5;
export const MaxSyncMessageToRemote = 10;
export const BOTTOM_INPUT_LEFT_MARGIN = 'width:4px;'

export const SWAGGER_DOC = {
  schema: {
    info: {
      title: 'Worker Wai Chat',
      version: '1.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};


