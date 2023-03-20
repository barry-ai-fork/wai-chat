import {getCorsHeader} from "../helpers/network";
import {DownloadReq, DownloadRes, UploadReq} from "../../lib/ptp/protobuf/PTPFile";
import {Pdu} from "../../lib/ptp/protobuf/BaseMsg";
import {storage} from "../helpers/env";
import {ERR, FileInfo} from "../../lib/ptp/protobuf/PTPCommon";

export async function Upload(request:Request){
  const arrayBuffer = await request.arrayBuffer();
  let pdu = new Pdu(Buffer.from(arrayBuffer));
  const req = UploadReq.parseMsg(pdu)
  const {id,part,part_total,size,type,buf} = req.file
  console.log("[UPLOAD]",id,size,type)
  const t = new FileInfo(req.file).encode();
  const tt = new FileInfo().decode(t)
  await storage.put(`media/${id}`,new FileInfo(req.file).encode())
  return new Response("",{
    status:200,
    headers:{
      ...getCorsHeader()
    }
  })
}

export async function Download(request:Request){
  const arrayBuffer = await request.arrayBuffer();
  let pdu = new Pdu(Buffer.from(arrayBuffer));
  const req = DownloadReq.parseMsg(pdu)
  console.log("[Download]",req)
  const res = await storage.get(`media/${req.id}`)
  const fileInfo = new FileInfo().decode(Uint8Array.from(res!))
  const body = Buffer.from(new DownloadRes({
    file:fileInfo,
    err:ERR.NO_ERROR
  }).pack().getPbData());
  return new Response(
    body,{
    status:200,
    headers:{
      ...getCorsHeader()
    }
  })
}



