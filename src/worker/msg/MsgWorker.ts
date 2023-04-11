import {ApiAttachment, ApiBotInfo, ApiChat, ApiMessage, ApiUpdate, OnApiUpdate} from "../../api/types";
import {LOCAL_MESSAGE_MIN_ID} from "../../config";
import {DownloadMsgRes, GenMsgIdReq, GenMsgIdRes, UploadMsgReq} from "../../lib/ptp/protobuf/PTPMsg";
import {getNextLocalMessageId} from "../../api/gramjs/apiBuilders/messages";
import {
  Pdu,
  popByteBuffer,
  readBytes,
  readInt16,
  readInt32,
  toUint8Array,
  wrapByteBuffer,
  writeBytes,
  writeInt16,
  writeInt32
} from "../../lib/ptp/protobuf/BaseMsg";
import {PbMsg, PbUser} from "../../lib/ptp/protobuf/PTPCommon";
import {account} from "../../api/gramjs/methods/client";
import {DownloadUserRes, UploadUserReq} from "../../lib/ptp/protobuf/PTPUser";
import {sleep} from "../../lib/gramjs/Helpers";
import {Api as GramJs} from "../../lib/gramjs";
import {blobToDataUri, fetchBlob} from "../../util/files";
import {parseCodeBlock, parseEntities} from "../share/utils/stringParse";
import MsgChatGptWorker from "./MsgChatGpWorker";

let messageIds:number[] = [];

export default class MsgWorker {
  private botInfo?: ApiBotInfo;
  private chat: ApiChat;
  private msgSend: ApiMessage;
  private media: GramJs.TypeInputMedia | undefined;
  private attachment?: ApiAttachment;
  private static onUpdate: (update: ApiUpdate) => void;
  constructor({
      chat,
      msgSend,
      attachment,
      media,
      botInfo,
    }:{
    chat:ApiChat;
    media: GramJs.TypeInputMedia | undefined;
    msgSend:ApiMessage;
    attachment?:ApiAttachment;
    botInfo?:ApiBotInfo;
  },onUpdate:OnApiUpdate) {
    MsgWorker.onUpdate = onUpdate;
    this.botInfo = botInfo;
    this.chat = chat;
    this.media = media;
    this.msgSend = msgSend;
    this.attachment = attachment;
  }
  static async beforeUploadUserReq(pdu:Pdu){
    const {users,...res} = UploadUserReq.parseMsg(pdu)
    if(users){
      for (let i = 0; i < users?.length; i++) {
        if (users) {
          const {time,user} = users[i]
          let buf = Buffer.from(new PbUser(user!).pack().getPbData())
          const password = "WAI" + time!.toString();
          // console.log("accountId",account.getAccountId())
          // console.log("entropy",await account.getEntropy())
          const cipher = await account.encryptData(buf,password)
          const bb = popByteBuffer();
          writeInt32(bb, cipher?.length + 4 + 4 + 4 + 2);
          writeInt16(bb, 1);
          writeInt32(bb, time!);
          writeInt32(bb, 0);
          writeBytes(bb, cipher);
          users[i].buf = Buffer.from(toUint8Array(bb));
          users[i].user = undefined
          // console.log("userId",user?.id)
          // console.log("buf",buf)
          // console.log("cipher",cipher)
          // console.log("msg buf",users[i].buf)
        }
      }
    }

    return new UploadUserReq({users,...res}).pack()
  }
  static async afterDownloadUserReq(pdu:Pdu){
    const {users,...res} = DownloadUserRes.parseMsg(pdu)
    if(users){
      for (let i = 0; i < users?.length; i++) {
        if (users) {
          const {buf} = users[i]
          const bbDecode = wrapByteBuffer(Buffer.from(buf!))
          const len = readInt32(bbDecode);
          const encrypt = readInt16(bbDecode) === 1;
          const time = readInt32(bbDecode);
          const reverse = readInt32(bbDecode);
          let cipher = readBytes(bbDecode,len - 14);
          const password = "WAI"+time.toString();
          // console.log("encode",Buffer.from(buf!).toString("hex"))
          // console.log("cipher",Buffer.from(cipher).toString("hex"))
          const buf2 = await account.decryptData(Buffer.from(cipher),password)
          // console.log("userId",user?.id)
          // console.log("buf",buf)
          // console.log("cipher",cipher)
          // console.log("msg buf",user)
          users[i].user = PbUser.parseMsg(new Pdu(Buffer.from(buf2)));
          users[i].buf = undefined
        }
      }
    }

    return Buffer.from(new DownloadUserRes({...res,users}).pack().getPbData())
  }
  static async afterDownloadMsgReq(pdu:Pdu){
    const {messages,...res} = DownloadMsgRes.parseMsg(pdu)
    if(messages){
      for (let i = 0; i < messages?.length; i++) {
        const {buf} = messages[i]
        const bbDecode = wrapByteBuffer(Buffer.from(buf!))
        const len = readInt32(bbDecode);
        const encrypt = readInt16(bbDecode) === 1;
        const time = readInt32(bbDecode);
        const reverse = readInt32(bbDecode);
        let cipher = readBytes(bbDecode,len - 14);
        const password = "WAI"+time.toString();
        // console.log("encode",Buffer.from(buf!).toString("hex"))
        // console.log("cipher",Buffer.from(cipher).toString("hex"))
        const buf2 = await account.decryptData(Buffer.from(cipher),password)
        messages[i].message = PbMsg.parseMsg(new Pdu(Buffer.from(buf2)))
        messages[i].buf = undefined
        // console.log("userId",user?.id)
        // console.log("buf",buf)
        // console.log("cipher",cipher)
        // console.log("msg buf",users[i].buf)
      }
    }
    return Buffer.from(new DownloadMsgRes({...res,messages}).pack().getPbData())
  }
  static async beforeUploadMsgReq(pdu:Pdu){
    const {messages,...res} = UploadMsgReq.parseMsg(pdu)

    if(messages){
      for (let i = 0; i < messages?.length; i++) {
        const {time,message} = messages[i]
        let buf = Buffer.from(new PbMsg(message!).pack().getPbData())
        const password = "WAI"+time!.toString();
        const cipher = await account.encryptData(buf,password)
        const bb = popByteBuffer();
        writeInt32(bb, cipher?.length + 4 + 4 + 4 + 2);
        writeInt16(bb, 1);
        writeInt32(bb, time!);
        writeInt32(bb, 0);
        writeBytes(bb, cipher);
        messages[i].buf = Buffer.from(toUint8Array(bb));
        messages[i].message = undefined
        // console.log("buf",buf)
        // console.log("cipher",cipher)
        // console.log("msg buf",messages[i].buf)
      }
    }
    return new UploadMsgReq({messages,...res}).pack()
  }

  static async genMessageId(isLocal?:boolean):Promise<number>{
    let msgId = isLocal ? getNextLocalMessageId() : parseInt(getNextLocalMessageId().toString()) % LOCAL_MESSAGE_MIN_ID;
    if(messageIds.length > 10){
      messageIds = messageIds.slice(messageIds.length - 10)
    }
    if(messageIds.includes(msgId)){
      await sleep(100);
      return MsgWorker.genMessageId(isLocal);
    }else{
      messageIds.push(msgId);
      return msgId
    }
  }

  static async genMsgId(pdu:Pdu):Promise<Uint8Array>{
    const {isLocal} = GenMsgIdReq.parseMsg(pdu)
    return new GenMsgIdRes({messageId:await MsgWorker.genMessageId(isLocal)}).pack().getPbData()
  }

  static getMediaFileId(){
    let fileId;
    //@ts-ignore
    if (this.media && this.media!.file && this.media.file.id) {
      //@ts-ignore
      fileId = media!.file.id.toString()
    }
    return fileId
  }
  async handleMedia(){
    const {msgSend,attachment} = this;
    if(attachment){
      let fileId = MsgWorker.getMediaFileId();

      if (msgSend.content.photo || msgSend.content.document) {
        const getPhotoInfo = async (attachment: ApiAttachment) => {
          const dataUri = await blobToDataUri(await fetchBlob(attachment.thumbBlobUrl!));
          const size = {
            "width": attachment.quick!.width,
            "height": attachment.quick!.height,
          }
          return {
            dataUri, size
          }
        }

        if (msgSend.content.document) {
          msgSend.content.document.id = fileId

          if (msgSend.content.document.mimeType.split("/")[0] === "image") {
            const {size, dataUri} = await getPhotoInfo(attachment);
            msgSend.content.document.mediaType = "photo";
            msgSend.content.document.previewBlobUrl = undefined;
            msgSend.content.document.thumbnail = {
              ...size,
              dataUri
            }
            msgSend.content.document.mediaSize = size;
          }
        }

        if(msgSend.content.photo){
          const {size,dataUri} = await getPhotoInfo(attachment);
          msgSend.content.photo = {
            isSpoiler:msgSend.content.photo.isSpoiler,
            id:fileId,
            "thumbnail": {
              ...size,
              dataUri
            },
            "sizes": [
              {
                ...size,
                "type": "y"
              }
            ],
          }
        }
        if(msgSend.content.voice){
          msgSend.content.voice.id = fileId
        }
        if(msgSend.content.audio){
          msgSend.content.audio.id = fileId
        }
      }
      this.msgSend = msgSend;
    }

  }
  static handleMessageTextCode(msgSend:ApiMessage){
    if(msgSend.content.text && msgSend.content.text.text){
      // @ts-ignore
      msgSend.content.text = parseCodeBlock(msgSend.content.text?.text)
    }
    return msgSend
  }
  static handleBotCmdText(msgSend:ApiMessage,botInfo:ApiBotInfo){
    const commands:string[] = []
    if(botInfo && botInfo.commands){
      botInfo.commands.forEach(cmd=>commands.push(cmd.command))
    }
    if(msgSend.content && msgSend.content.text && msgSend.content.text.text){
      // @ts-ignore
      msgSend.content.text!.entities = [
        ...msgSend.content.text!.entities||[],
        ...parseEntities(msgSend.content.text!.text!,commands)
      ]
    }
    return msgSend;
  }
  static updateMessage(chatId:string,messageId:number,message:Partial<ApiMessage>){
    MsgWorker.onUpdate({
      '@type': "updateMessage",
      id: messageId,
      chatId,
      message,
    });
    return message
  }
  static newMessage(chatId:string,messageId:number,message:ApiMessage){
    MsgWorker.onUpdate({
      '@type': "newMessage",
      chatId,
      id:messageId,
      message,
      shouldForceReply:false
    });
    return message
  }
  async processOutGoing(){
    const {msgSend} = this;
    const msgId = await MsgWorker.genMessageId();
    let message = {
      ...msgSend,
      id:msgId,
      sendingState: undefined,
    };
    MsgWorker.onUpdate({
      '@type': "updateMessageSendSucceeded",
      chatId: msgSend.chatId,
      localId:msgSend.id,
      message,
    });
  }
  async processBotMsg(){
    const {botInfo,msgSend} =this;
    if(
      msgSend.content.text && msgSend.content.text.text &&
      botInfo?.aiBot && botInfo?.aiBot.enableAi && botInfo?.aiBot.chatGptConfig
    ){
      return await new MsgChatGptWorker(this.msgSend,botInfo).process()
    }
    //
    //
    //     if(bot.bot){
    //       if(bot.bot.chatGptConfig){
    //         if(msgSend.content.text?.text.indexOf("/") === 0 && commands.includes(msgSend.content.text?.text.substring(1))){
    //           switch (msgSend.content.text?.text.substring(1)){
    //             case "start":
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   isOutgoing:false,
    //                   content:{
    //                     text:{
    //                       text:bot.botInfo?.description!
    //                     }
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               return
    //             case "apiKey":
    //               localDb.botWaitReply['waitReply_'+msgSend.chatId] = {
    //                 command:"apiKey",
    //                 payload:{
    //                   messageId:msgId+1,
    //                 }
    //               };
    //               message = {
    //                 chatId: chat.id,
    //                 date: Math.ceil(+(new Date())/1000),
    //                 senderId:msgSend.chatId,
    //                 id:msgId+1,
    //                 isOutgoing:false,
    //                 content:{
    //                   text:parseCodeBlock((bot.bot.chatGptConfig.api_key ? `\n当前 openAi apiKey：\n\n`+"```\n"+`${bot.bot.chatGptConfig.api_key}`
    //                     +"```"+`\n\n` : "\n>>> openAi apiKey 未设置！ <<<\n\n" )+ "修改设置,请直接回复:\n")
    //                 },
    //                 inlineButtons:[
    //                   [
    //                     {
    //                       type:"command",
    //                       text:"取消修改",
    //                     }
    //                   ]
    //                 ],
    //                 sendingState: undefined
    //               }
    //
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:message.id,
    //                 message,
    //                 shouldForceReply:false
    //               });
    //               return;
    //             case "initPrompt":
    //               localDb.botWaitReply['waitReply_'+msgSend.chatId] = {
    //                 command:"initPrompt",
    //                 payload:{
    //                   messageId:msgId+1,
    //                 }
    //               };
    //               message = {
    //                 chatId: chat.id,
    //                 date: Math.ceil(+(new Date())/1000),
    //                 senderId:msgSend.chatId,
    //                 id:msgId+1,
    //                 isOutgoing:false,
    //                 content:{
    //                   text:parseCodeBlock((bot.bot.chatGptConfig.init_system_content ? `\n当前 初始化上下文 Prompt：\n\n`+"```\n"+`${bot.bot.chatGptConfig.init_system_content}`
    //                     +"```"+`\n\n` : "\n>>> 初始化上下文 Prompt 未设置！ <<<\n\n" )+ "修改设置,请直接回复:\n")
    //                 },
    //                 sendingState: undefined,
    //                 inlineButtons:[
    //                   [
    //                     {
    //                       type:"command",
    //                       text:"取消修改",
    //                     }
    //                   ]
    //                 ]
    //               }
    //
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:message.id,
    //                 message,
    //                 shouldForceReply:false
    //               });
    //               return;
    //             case "aiModel":
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   inlineButtons:[
    //                     [
    //                       {
    //                         type:"callback",
    //                         data:"gpt-3.5-turbo",
    //                         text:"✅ ChatGpt(gpt-3.5-turbo)",
    //                       },
    //                     ],
    //                   ],
    //                   isOutgoing:false,
    //                   content:{
    //                     text:{
    //                       text:`当前模型:`
    //                     }
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               return;
    //             case "enableAi":
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   inlineButtons:[
    //                     [
    //                       {
    //                         type:"command",
    //                         text:bot.bot.enableAi ? "关闭Ai" : "开启Ai",
    //                       }
    //                     ],
    //                   ],
    //                   isOutgoing:false,
    //                   content:{
    //                     text:{
    //                       text:`Ai开关：`
    //                     }
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               return;
    //           }
    //         }
    //
    //         if(localDb.botWaitReply['waitReply_'+msgSend.chatId]){
    //           switch (localDb.botWaitReply['waitReply_'+msgSend.chatId]!.command) {
    //             case "apiKey_confirm":
    //               const {messageId,chatGptApiKey} = localDb.botWaitReply['waitReply_'+msgSend.chatId]?.payload!;
    //               onUpdate({
    //                 '@type': "updateMessage",
    //                 chatId: msgSend.chatId,
    //                 id:messageId,
    //                 message: {
    //                   inlineButtons:undefined
    //                 }
    //               });
    //               localDb.botWaitReply['waitReply_'+msgSend.chatId] = undefined
    //               let text;
    //               if(msgSend.content.text?.text === "✅ 确定"){
    //                 onUpdate({
    //                   '@type': "updateGlobalUpdate",
    //                   data:{
    //                     action:"updateBot",
    //                     payload:{
    //                       botInfo:bot.botInfo,
    //                       bot:{
    //                         ...bot.bot,
    //                         chatGptConfig:{
    //                           ...bot.bot.chatGptConfig,
    //                           api_key:chatGptApiKey.trim()
    //                         }
    //                       }
    //                     }
    //                   }
    //                 });
    //                 text = "更改成功"
    //               }else{
    //                 text = "放弃修改"
    //               }
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   isOutgoing:false,
    //                   content:{
    //                     text:{
    //                       text
    //                     }
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               break;
    //             case "apiKey":
    //               const chatGptApiKey1 = msgSend.content.text?.text;
    //               if(chatGptApiKey1 === "取消修改"){
    //                 onUpdate({
    //                   '@type': "updateMessage",
    //                   chatId: msgSend.chatId,
    //                   id:localDb.botWaitReply['waitReply_'+msgSend.chatId]!.payload!.messageId,
    //                   message: {
    //                     inlineButtons:undefined
    //                   }
    //                 });
    //                 localDb.botWaitReply['waitReply_'+msgSend.chatId] = undefined
    //                 return
    //               }
    //
    //               localDb.botWaitReply['waitReply_'+msgSend.chatId] = {
    //                 command:"apiKey_confirm",
    //                 payload:{
    //                   chatGptApiKey:chatGptApiKey1,
    //                   messageId:msgId+1
    //                 }
    //               };
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   inlineButtons:[
    //                     [
    //                       {
    //                         type:"command",
    //                         text:"✅ 确定",
    //                       },
    //                       {
    //                         type:"command",
    //                         text:"取消",
    //                       }
    //                     ]
    //                   ],
    //                   isOutgoing:false,
    //                   content:{
    //                     text:parseCodeBlock(`\n  确认将 apiKey 更改为:\n `+"```\n"+`${chatGptApiKey1}`+"```")
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               break
    //             case "initPrompt_confirm":
    //               const initPrompt_confirm_payload = localDb.botWaitReply['waitReply_'+msgSend.chatId]?.payload!;
    //               onUpdate({
    //                 '@type': "updateMessage",
    //                 chatId: msgSend.chatId,
    //                 id:initPrompt_confirm_payload.messageId,
    //                 message: {
    //                   inlineButtons:undefined
    //                 }
    //               });
    //               localDb.botWaitReply['waitReply_'+msgSend.chatId] = undefined
    //               let text1;
    //               if(msgSend.content.text?.text === "✅ 确定"){
    //                 onUpdate({
    //                   '@type': "updateGlobalUpdate",
    //                   data:{
    //                     action:"updateBot",
    //                     payload:{
    //                       botInfo:bot.botInfo,
    //                       bot:{
    //                         ...bot,
    //                         chatGptConfig:{
    //                           ...bot.bot.chatGptConfig,
    //                           init_system_content:initPrompt_confirm_payload.prompt.trim()
    //                         }
    //                       }
    //                     }
    //                   }
    //                 });
    //                 text1 = "更改成功"
    //               }else{
    //                 text1 = "放弃修改"
    //               }
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   isOutgoing:false,
    //                   content:{
    //                     text:{
    //                       text:text1
    //                     }
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               break;
    //             case "initPrompt":
    //               const prompt = msgSend.content.text?.text;
    //               if(prompt === "取消修改"){
    //                 onUpdate({
    //                   '@type': "updateMessage",
    //                   chatId: msgSend.chatId,
    //                   id:localDb.botWaitReply['waitReply_'+msgSend.chatId]!.payload!.messageId,
    //                   message: {
    //                     inlineButtons:undefined
    //                   }
    //                 });
    //                 localDb.botWaitReply['waitReply_'+msgSend.chatId] = undefined
    //                 return
    //               }
    //               localDb.botWaitReply['waitReply_'+msgSend.chatId] = {
    //                 command:"initPrompt_confirm",
    //                 payload:{
    //                   prompt:prompt,
    //                   messageId:msgId+1
    //                 }
    //               };
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:msgId+1,
    //                 message:{
    //                   chatId: chat.id,
    //                   date: Math.ceil(+(new Date())/1000),
    //                   senderId:msgSend.chatId,
    //                   id:msgId+1,
    //                   inlineButtons:[
    //                     [
    //                       {
    //                         type:"command",
    //                         text:"✅ 确定",
    //                       },
    //                       {
    //                         type:"command",
    //                         text:"取消",
    //                       }
    //                     ]
    //                   ],
    //                   isOutgoing:false,
    //                   content:{
    //                     text:parseCodeBlock(`\n  确认将 初始化 上下文 Prompt 更改为:\n `+"```\n"+`${prompt}`+"```")
    //                   },
    //                   sendingState: undefined
    //                 },
    //                 shouldForceReply:false
    //               });
    //               break
    //           }
    //           return;
    //         }
    //       }
    //       if(
    //         msgSend.content.text?.text &&
    //         ["取消","确定","关闭Ai","开启Ai","✅ 确定","取消修改"].includes(msgSend.content!.text?.text!)
    //       ){
    //         switch (msgSend.content.text?.text){
    //           case "开启Ai":
    //             onUpdate({
    //               '@type': "updateGlobalUpdate",
    //               data:{
    //                 action:"updateBot",
    //                 payload:{
    //                   botInfo:bot.botInfo,
    //                   bot:{
    //                     ...bot.bot,
    //                     enableAi:true
    //                   }
    //                 }
    //               }
    //             });
    //             onUpdate({
    //               '@type': "newMessage",
    //               chatId: msgSend.chatId,
    //               id:msgId+1,
    //               message:{
    //                 chatId: chat.id,
    //                 date: Math.ceil(+(new Date())/1000),
    //                 senderId:msgSend.chatId,
    //                 id:msgId+1,
    //                 isOutgoing:false,
    //                 content:{
    //                   text:{
    //                     text:"开启Ai成功"
    //                   }
    //                 },
    //                 sendingState: undefined
    //               },
    //               shouldForceReply:false
    //             });
    //             break
    //           case "关闭Ai":
    //             onUpdate({
    //               '@type': "updateGlobalUpdate",
    //               data:{
    //                 action:"updateBot",
    //                 payload:{
    //                   botInfo:bot.botInfo,
    //                   bot:{
    //                     ...bot.bot,
    //                     enableAi:false
    //                   }
    //                 }
    //               }
    //             });
    //             onUpdate({
    //               '@type': "newMessage",
    //               chatId: msgSend.chatId,
    //               id:msgId+1,
    //               message:{
    //                 chatId: chat.id,
    //                 date: Math.ceil(+(new Date())/1000),
    //                 senderId:msgSend.chatId,
    //                 id:msgId+1,
    //                 isOutgoing:false,
    //                 content:{
    //                   text:{
    //                     text:"关闭Ai成功"
    //                   }
    //                 },
    //                 sendingState: undefined
    //               },
    //               shouldForceReply:false
    //             });
    //             break
    //         }
    //         return
    //       }
    //       if(
    //         msgSend.content.text?.text &&
    //         !msgSend.content.text?.text.startsWith("/") &&
    //         !["取消","确定","关闭Ai","开启Ai","✅ 确定","取消修改"].includes(msgSend.content.text?.text!)
    //       ){
    //         if(bot.bot.enableAi && bot.bot.chatGptConfig){
    //           if(!bot.bot.chatGptConfig.api_key){
    //             if(DEBUG && process.env.OPENAI_APIKEY){
    //               console.log("DEBUG OPENAI_APIKEY")
    //             }else{
    //               message = {
    //                 chatId: chat.id,
    //                 date: Math.ceil(+(new Date())/1000),
    //                 senderId:msgSend.chatId,
    //                 id:msgId+1,
    //                 isOutgoing:false,
    //                 content:{
    //                   text:{
    //                     text:"还没有配置 请点击 /apiKey 进行配置"
    //                   }
    //                 },
    //                 sendingState: undefined
    //               }
    //               if(message.content && message.content.text && message.content.text.text){
    //                 // @ts-ignore
    //                 message.content.text!.entities = [
    //                   ...message.content.text!.entities||[],
    //                   ...parseEntities(message.content.text!.text!,commands)
    //                 ]
    //               }
    //               onUpdate({
    //                 '@type': "newMessage",
    //                 chatId: msgSend.chatId,
    //                 id:message.id,
    //                 message,
    //                 shouldForceReply:false
    //               });
    //               return
    //             }
    //
    //           }
    //
    //
    //           if(!msgSend.content.text?.text.startsWith("/")){
    //             const apiKey = process.env.OPENAI_APIKEY!
    //             let localId = msgId! + 1
    //             message = {
    //               ...msgSend,
    //               senderId:msgSend.chatId,
    //               id:localId,
    //               isOutgoing:false,
    //               content:{
    //                 text:{
    //                   text:"..."
    //                 }
    //               },
    //               sendingState: undefined,
    //             }
    //             onUpdate({
    //               '@type': "newMessage",
    //               chatId: msgSend.chatId,
    //               id:localId,
    //               message,
    //               shouldForceReply:false
    //             });
    //
    //             onUpdate({
    //               '@type': "updateGlobalUpdate",
    //               data:{
    //                 action:"setPauseSyncToRemote",
    //                 payload:{
    //                   pauseSyncToRemote:true
    //                 }
    //               }
    //             });
    //
    //
    //           }
    //         }
    //
    //       }
    //
    //     }
    //   }else {
    //     await Account.getCurrentAccount()?.sendPduWithCallback(new SendReq({
    //       payload:JSON.stringify({
    //         msg:msgSend
    //       })
    //     }).pack());
    //   }
    // } catch (error: any) {

    // }
  }
  async process(){
    const {msgSend,chat,botInfo} = this;

    try {
      await this.handleMedia();
      if(botInfo){
        this.msgSend = MsgWorker.handleBotCmdText(msgSend,botInfo);
      }
      await this.processOutGoing();
      if(this.botInfo){
        await this.processBotMsg();
      }
    }catch (error:any){
      MsgWorker.onUpdate({
        '@type': 'updateMessageSendFailed',
        chatId: chat.id,
        localId: msgSend.id,
        error: error.message,
      });
    }
  }
}
