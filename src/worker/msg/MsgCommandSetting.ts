import MsgDispatcher from "./MsgDispatcher";
import {selectChatMessage, selectChatMessages, selectUser} from "../../global/selectors";
import {addChats, addUsers, updateChatListIds, updateUser} from "../../global/reducers";
import {UserIdFirstBot} from "../setting";
import {getActions, getGlobal, setGlobal} from "../../global";
import {ApiKeyboardButtons, ApiMessage, ApiUser} from "../../api/types";
import {callApiWithPdu} from "./utils";
import {currentTs} from "../share/utils/utils";
import {
  MessageStoreRow_Type, PbMsg_Type,
  QrCodeType,
  UserStoreData_Type,
  UserStoreRow_Type
} from "../../lib/ptp/protobuf/PTPCommon/types";
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
import {Decoder} from "@nuintun/qrcode";
import {PbQrCode} from "../../lib/ptp/protobuf/PTPCommon";
import {Pdu} from "../../lib/ptp/protobuf/BaseMsg";
import {aesDecrypt} from "../../util/passcode";

let currentSyncBotContext:string|undefined;

export default class MsgCommandSetting{
  static async start(chatId:string){
    const messageId = await MsgDispatcher.genMsgId();
    const text = `你可以通过发送以下命令来控制我：

/setting - 设置面板
/clearHistory - 清除历史记录
/reloadCommands - 重载命令
/lab - 实验室
  * 创建中文Prompt大全
  * 创建英文Prompt大全
`
    return MsgDispatcher.newMessage(chatId,messageId,{
      chatId,
      id:messageId,
      senderId:chatId,
      isOutgoing:false,
      date:currentTs(),
      content:{
        text:{
          text
        }
      },
    })
  }
  static async setting(chatId:string){
    const account = Account.getCurrentAccount();
    const isEnableSync = account?.getSession();
    const messageId = await MsgDispatcher.genMsgId();
    return MsgDispatcher.newMessage(chatId,messageId,{
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
          data:`${chatId}/setting/accountAddress`,
          text:"账户地址",
          type:"callback"
        },
      ],
      [
        {
          data:`${chatId}/setting/showMnemonic`,
          text:"二维码导出账户",
          type:"callback"
        },
      ],
      [
        {
          text:"二维码导入账户",
          type:"requestUploadImage"
        },
      ],
      [
        {
          data:`${chatId}/setting/disableSync`,
          text:"单机模式",
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
          text:"二维码导入账户",
          type:'requestUploadImage',
        },
      ],
      [
        {
          data:`${chatId}/setting/enableSync`,
          text:"云端模式",
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
  static async requestUploadImage(global:GlobalState,chatId:string,messageId:number,files:FileList | null){
    if(files && files.length > 0){
      const file = files[0]
      const qrcode = new Decoder();
      const blob = new Blob([file], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);
      try {
        const result = await qrcode.scan(blobUrl)
        if(result && result.data.startsWith('wai://')){
          const mnemonic =  result.data
          const qrcodeData = mnemonic.replace('wai://','')
          const qrcodeDataBuf = Buffer.from(qrcodeData,'hex')
          const decodeRes = PbQrCode.parseMsg(new Pdu(qrcodeDataBuf))
          if(decodeRes){
            const {type,data} = decodeRes;
            if(type !== QrCodeType.QrCodeType_MNEMONIC){
              throw new Error("解析二维码失败")
            }
            const {password} = await getPasswordFromEvent();
            const res = await aesDecrypt(data,Buffer.from(hashSha256(password),"hex"))
            if(res){
              await MsgCommandSetting.setMnemonic(chatId,res,password);
              return;
            }
          }
        }
      }catch (e){

      }finally {
        getActions().showNotification({message:"解析二维码失败"})
      }
    }
  }
  static async setMnemonic(chatId:string,data:string,password?:string){
    const mnemonic = new Mnemonic(data)
    if(mnemonic.checkMnemonic()){
      await MsgCommand.sendText(chatId,mnemonic.toEntropy())
      if(!password){
        const res = await getPasswordFromEvent()
        if(res.password){
          password = res.password
        }else{
          return
        }
      }
      if(password){
        const entropy = mnemonic.toEntropy();
        let accountId = Account.getAccountIdByEntropy(entropy);
        if(!accountId){
          accountId = Account.genAccountId()
        }
        const account = Account.getInstance(accountId);
        Account.setCurrentAccountId(accountId);
        await account?.setEntropy(entropy)
        const pwd = hashSha256(password)
        const ts = +(new Date());
        const {address, sign} = await account!.signMessage(ts.toString(), pwd);
        const session = Account.formatSession({address,sign,ts});
        account!.saveSession(session)
        await callApiWithPdu(new AuthNativeReq({
          accountId,entropy:mnemonic.toEntropy(),session
        }).pack())
        window.location.reload()
      }
    }else{
      await MsgCommand.sendText(chatId,"mnemonic 不合法")
    }
  }
  static async answerCallbackButton(global:GlobalState,chatId:string,messageId:number,data:string){
    switch (data){
      case `${chatId}/setting/getSession`:
        const account = Account.getCurrentAccount();
        const entropy = await account?.getEntropy();
        const mnemonic = Mnemonic.fromEntropy(entropy!)
        const accountId = account?.getAccountId()
        Account.getEntropyList();

        await MsgCommand.sendText(chatId,accountId!.toString())
        await MsgCommand.sendText(chatId,entropy!)
        await MsgCommand.sendText(chatId,mnemonic.getWords())
        const session = account?.getSession()
        if(session){
          const {address} = Account.parseSession(session)!
          await MsgCommand.sendText(chatId,address)
        }
        break
      case `${chatId}/setting/setMnemonic`:
      case `${chatId}/setting/import`:
        const res = prompt("setMnemonic")
        if(res){
          await MsgCommandSetting.setMnemonic(chatId,res)
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
      case `${chatId}/setting/accountAddress`:
        const address = Account.getCurrentAccount()?.getSessionAddress()
        await MsgDispatcher.newCodeMessage(chatId,undefined,address||"-")
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
        }else{
          await MsgCommandSetting.enableSync(global,chatId,messageId,password)
        }
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
    console.log("[syncRes]",syncRes)
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
      let {chatFolders,...res} = syncRes.userStoreData
      if(!chatFolders){
        // @ts-ignore
        chatFolders = global.chatFolders
      }else{
        chatFolders = JSON.parse(chatFolders)
      }
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
                  chatIds.push(user?.id!)
                  // @ts-ignore
                  addUsersObj[user!.id] = user!
                  // @ts-ignore
                  addChatsObj[user!.id] = MsgCommandSetting.buildDefaultChat(user!)
                }
              }
            }
            if(Object.keys(addUsersObj).length > 0){
              global = addUsers(global,addUsersObj)
              global = addChats(global,addChatsObj)
            }
          }
          global = updateChatListIds(global, "active", chatIds);
          // @ts-ignore
          global = {...global,chatFolders}
          setGlobal({
            ...global,
            chatIdsDeleted:chatIdsDeleted || [],
          })
        }
      }else{
        getActions().updateGlobal({
          chatIdsDeleted:chatIdsDeleted || [],
          chatFolders
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
    let global = getGlobal();
    if(isUpload){
      const messageById = selectChatMessages(global,chatId);
      const messages:MessageStoreRow_Type[] = [];
      if(messageById){
        for (let i = 0; i < Object.keys(messageById).length; i++) {
          const msgId = parseInt(Object.keys(messageById)[i])
          // @ts-ignore
          const message:PbMsg_Type = messageById[msgId]
          messages.push({
            time:currentTs(),
            message,
            messageId:msgId,
          })
        }
      }
      await MsgCommandSetting.uploadMsgList(chatId,messages)

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
        getActions().showNotification({message:"更新成功"})
      }else{
        getActions().showNotification({message:"更新失败"})
      }
    }
  }
  static async uploadMsgList(chatId:string,messages:MessageStoreRow_Type[]){

    if(messages.length > 0){
      const res = await callApiWithPdu(new UploadMsgReq({
        messages,
        chatId,
        time:currentTs(),
      }).pack())
      if(!res){
        getActions().showNotification({message:"更新失败"})
      }else{
        getActions().showNotification({message:"更新成功"})
      }
    }
  }
}
