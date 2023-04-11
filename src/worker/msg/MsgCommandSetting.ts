import MsgDispatcher from "./MsgDispatcher";
import {selectChatMessage, selectChatMessages, selectUser} from "../../global/selectors";
import {addChats, addUsers, updateUser} from "../../global/reducers";
import {UserIdFirstBot} from "../setting";
import {getActions, getGlobal, setGlobal} from "../../global";
import {ApiKeyboardButtons, ApiUser} from "../../api/types";
import {callApiWithPdu} from "./utils";
import {currentTs} from "../share/utils/utils";
import {MessageStoreRow_Type, UserStoreData_Type, UserStoreRow_Type} from "../../lib/ptp/protobuf/PTPCommon/types";
import {DownloadMsgReq, DownloadMsgRes, UploadMsgReq} from "../../lib/ptp/protobuf/PTPMsg";
import {DownloadUserReq, DownloadUserRes, UploadUserReq} from "../../lib/ptp/protobuf/PTPUser";
import Mnemonic from "../../lib/ptp/wallet/Mnemonic";
import Account from "../share/Account";
import {AuthNativeReq} from "../../lib/ptp/protobuf/PTPAuth";
import {GlobalState} from "../../global/types";
import {getPasswordFromEvent} from "../share/utils/password";
import {hashSha256} from "../share/utils/helpers";
import {SyncReq, SyncRes} from "../../lib/ptp/protobuf/PTPSync";
import MsgCommand from "./MsgCommand";

let currentSyncBotContext:string|undefined;

export default class MsgCommandSetting{
  static async setting(chatId:string){
    const account = Account.getCurrentAccount();
    const isEnableSync = account?.getSession();
    const messageId = await MsgDispatcher.genMsgId();
    MsgDispatcher.newMessage(chatId,messageId,{
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text:"设置面板"
        }
      },
      inlineButtons:MsgCommandSetting.getInlineButtons(chatId,!!isEnableSync),
    })
  }
  static getInlineButtons(chatId:string,isEnableSync:boolean):ApiKeyboardButtons{
    return isEnableSync ? [
      [
        {
          data:`${chatId}/setting/uploadFolder`,
          text:"上传对话",
          type:"callback"
        },
        {
          data:`${chatId}/setting/downloadFolder`,
          text:"下载对话",
          type:"callback"
        },
      ],
      [
        {
          data:`${chatId}/setting/uploadMessages`,
          text:"上传消息",
          type:"callback"
        },
        {
          data:`${chatId}/setting/downloadMessages`,
          text:"下载消息",
          type:"callback"
        },
      ],

      [
        {
          data:`${chatId}/setting/getSession`,
          text:"获取session",
          type:"callback"
        },
      ],
      [
        {
          data:`${chatId}/setting/showMnemonic`,
          text:"showMnemonic",
          type:"callback"
        },
        {
          data:`${chatId}/setting/setMnemonic`,
          text:"setMnemonic",
          type:"callback"
        },
      ],
      [
        {
          data:`${chatId}/setting/disableSync`,
          text:"关闭同步",
          type:"callback"
        },
        {
          data:`${chatId}/setting/cancel`,
          text:"取消",
          type:"callback"
        },
      ],
    ]:[
      [
        {
          data:`${chatId}/setting/enableSync`,
          text:"开启同步",
          type:"callback"
        },
        {
          data:`${chatId}/setting/cancel`,
          text:"取消",
          type:"callback"
        },
      ],
    ]
  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    switch (data){
      case `${chatId}/setting/getSession`:
        const account = Account.getCurrentAccount();
        const entropy = await account?.getEntropy();
        const mnemonic = Mnemonic.fromEntropy(entropy!)
        await MsgCommand.sendText(chatId,account?.getSession()!)
        await MsgCommand.sendText(chatId,entropy!)
        await MsgCommand.sendText(chatId,mnemonic.getWords())
        break

      case `${chatId}/setting/setMnemonic`:
        const res = prompt("setMnemonic")
        if(res){
          const mnemonic = new Mnemonic(res)
          if(mnemonic.checkMnemonic()){
            await MsgCommand.sendText(chatId,mnemonic.toEntropy())
            const {password} = await getPasswordFromEvent()
            if(password){
              const entropy = mnemonic.toEntropy();
              let accountId = Account.getAccountIdByEntropy(entropy);
              if(!accountId){
                accountId = Account.genAccountId()
              }
              const account = Account.getInstance(accountId);
              Account.setCurrentAccountId(accountId);
              await account?.setEntropy(entropy,true)
              const pwd = hashSha256(password)
              const ts = +(new Date());
              const {address, sign} = await account!.signMessage(ts.toString(), pwd);
              const session = Account.formatSession({address,sign,ts});
              account!.saveSession(session)
              await callApiWithPdu(new AuthNativeReq({
                accountId,entropy:mnemonic.toEntropy(),session
              }).pack())
              await MsgCommand.sendText(chatId,session)
              window.location.reload()
            }
          }else{
            await MsgCommand.sendText(chatId,"mnemonic 不合法")
          }
        }
        break
      case `${chatId}/setting/uploadFolder`:
        await MsgCommandSetting.syncFolders(true)
        break
      case `${chatId}/setting/downloadFolder`:
        await MsgCommandSetting.syncFolders(false)
        break
      case `${chatId}/setting/syncMessage`:
        getActions().updateGlobal({
          showPickBotModal:true
        })
        break
      case `${chatId}/setting/uploadMessages`:
      case `${chatId}/setting/downloadMessages`:
        currentSyncBotContext = data;
        getActions().updateGlobal({
          showPickBotModal:true
        })
        break
      case `${chatId}/setting/showMnemonic`:
        getActions().updateGlobal({
          showMnemonicModal:true
        })
        break
      case `${chatId}/setting/cancel`:
        MsgDispatcher.updateMessage(chatId,messageId,{
          inlineButtons:[],
        })
        break
      case `${chatId}/setting/disableSync`:
        await MsgCommandSetting.disableSync(global,chatId,messageId)
        break
      case `${chatId}/setting/enableSync`:
        const {password} = await getPasswordFromEvent()
        if(!password){
          MsgDispatcher.updateMessage(chatId,messageId,{
            inlineButtons:[],
          })
        }
        await MsgCommandSetting.enableSync(global,chatId,messageId,password)
        break
    }
  }
  static buildDefaultChat(user:ApiUser){
    return {
      "id": user.id,
      "title":  user.firstName,
      "type": "chatTypePrivate",
      "isMuted": false,
      "isMin": false,
      "hasPrivateLink": false,
      "isSignaturesShown": false,
      "isVerified": true,
      "isJoinToSend": true,
      "isJoinRequest": true,
      lastMessage:{
        id:0,
        chatId:user.id,
        isOutgoing:false,
        date:Math.ceil(+(new Date)/1000),
        content:{
          action:{
            type:"chatCreate",
            text:"",
          }
        }
      },
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
  }
  static async syncFolders(isUpload:boolean){
    let global = getGlobal();
    const chats = global.chats.byId
    const chatIds = Object.keys(chats).filter(id=>id !== "1");
    const chatIdsDeleted:string[] = global.chatIdsDeleted;
    console.log("local",{chatIds,chatIdsDeleted})
    const userStoreData:UserStoreData_Type|undefined = isUpload ?{
      time:currentTs(),
      chatFolders:JSON.stringify(global.chatFolders),
      chatIds,
      chatIdsDeleted
    } :undefined

    const res = await callApiWithPdu(new SyncReq({
      userStoreData
    }).pack())
    const syncRes = SyncRes.parseMsg(res!.pdu)
    let users:UserStoreRow_Type[] = [];
    if(isUpload){
      for (let index = 0; index < chatIds.length; index++) {
        const userId = chatIds[index];
        users.push({
          time:currentTs(),
          userId,
          user:selectUser(global,userId)
        })
      }
      await callApiWithPdu(new UploadUserReq({
        users,
        time:currentTs()
      }).pack())
    }

    if(syncRes.userStoreData){
      const {chatFolders,...res} = syncRes.userStoreData
      res.chatIdsDeleted?.forEach(id=>{
        if(!chatIdsDeleted.includes(id)){
          chatIdsDeleted.push(id)
        }
      })
      console.log("remote",res)
      if(res.chatIds){
        const DownloadUserReqRes = await callApiWithPdu(new DownloadUserReq({
          userIds:res.chatIds,
        }).pack())
        if(DownloadUserReqRes){
          const downloadUserRes = DownloadUserRes.parseMsg(DownloadUserReqRes?.pdu!)
          console.log("downloadUserRes",downloadUserRes)
          global = getGlobal();
          if(downloadUserRes.users){
            const addUsersObj = {}
            const addChatsObj = {}
            for (let index = 0; index < downloadUserRes.users.length; index++) {
              const {user} = downloadUserRes.users[index];
              if(!chatIdsDeleted.includes(user!.id)){
                if(chatIds.includes(user!.id)){
                  // @ts-ignore
                  global = updateUser(global,user!.id, user!)
                }else{
                  // @ts-ignore
                  addUsersObj[user!.id] = user!
                  // @ts-ignore
                  addChatsObj[user!.id] = MsgCommandSetting.buildDefaultChat(user!)
                }
                if(Object.keys(addUsersObj).length > 0){
                  global = addUsers(global,addUsersObj)
                  global = addChats(global,addChatsObj)
                }
              }
            }
          }
          setGlobal({
            ...global,
            chatIdsDeleted:chatIdsDeleted || [],
            chatFolders:JSON.parse(chatFolders)
          })
        }
      }else{
        getActions().updateGlobal({
          chatIdsDeleted:chatIdsDeleted || [],
          chatFolders:JSON.parse(chatFolders)
        })
      }
    }
    getActions().showNotification({message:"更新成功"})
  }
  static async enableSync(global:GlobalState,chatId:string,messageId:number,password:string){
    const account = Account.getCurrentAccount();
    const pwd = hashSha256(password)
    const ts = +(new Date());
    const {address, sign} = await account!.signMessage(ts.toString(), pwd);
    const session = Account.formatSession({address,sign,ts});
    account!.saveSession(session)
    const entropy = await account!.getEntropy()
    const accountId = account!.getAccountId();
    await callApiWithPdu(new AuthNativeReq({
      accountId,entropy,session
    }).pack())
    MsgDispatcher.updateMessage(chatId,messageId,{
      inlineButtons:[]
    })
    getActions().showNotification({message:"开启成功"})
    setTimeout(()=>window.location.reload(),500)
  }

  static async disableSync(global:GlobalState,chatId:string,messageId:number){
    const account = Account.getCurrentAccount();
    account?.delSession();
    MsgDispatcher.updateMessage(chatId,messageId,{
      inlineButtons:[]
    })
    await callApiWithPdu(new AuthNativeReq({
      accountId:account!.getAccountId(),
      entropy:await account!.getEntropy(),
      session:undefined
    }).pack())
    getActions().showNotification({message:"关闭成功"})
    setTimeout(()=>window.location.reload(),500)
  }

  static async onSelectSyncBot(chatId:string){
    const data = currentSyncBotContext;
    const isUpload = !data?.endsWith("downloadMessages");
    currentSyncBotContext = undefined
    await MsgCommand.sendText(UserIdFirstBot,data!)
    let global = getGlobal();
    if(isUpload){
      const messageById = selectChatMessages(global,chatId);
      const messages:MessageStoreRow_Type[] = [];
      if(messageById){
        for (let i = 0; i < Object.keys(messageById).length; i++) {
          const msgId = parseInt(Object.keys(messageById)[i])
          messages.push({
            time:currentTs(),
            message:messageById[msgId],
            messageId:msgId,
          })
        }
      }
      if(messages.length > 0){
        const res = await callApiWithPdu(new UploadMsgReq({
          messages,
          chatId,
          time:currentTs(),
        }).pack())
        if(!res){
          getActions().showNotification({message:"更新失败"})
        }
      }
    }else{
      const res = await callApiWithPdu(new DownloadMsgReq({
        chatId,
      }).pack())
      if(res){
        const {err,messages} = DownloadMsgRes.parseMsg(res?.pdu)
        console.log("messages",messages)
        if(messages){
          for (let i = 0; i < messages?.length; i++) {
            const {message,messageId} = messages[i]
            const localMsg = selectChatMessage(global,chatId,messageId)
            if(!localMsg){
              // @ts-ignore
              MsgDispatcher.newMessage(chatId,messageId,message)
            }else{
              // @ts-ignore
              MsgDispatcher.updateMessage(chatId,messageId,message)
            }
          }
        }

      }else{
        getActions().showNotification({message:"更新失败"})
      }
    }
  }
}
