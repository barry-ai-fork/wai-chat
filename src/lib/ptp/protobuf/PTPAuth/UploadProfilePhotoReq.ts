import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UploadProfilePhotoReq_Type } from './types';

export default class UploadProfilePhotoReq extends BaseMsg {
  constructor(msg?: UploadProfilePhotoReq_Type) {
    super('PTP.Auth.UploadProfilePhotoReq', msg);
    this.setCommandId(ActionCommands.CID_UploadProfilePhotoReq);
  }
  decode(data: Uint8Array): UploadProfilePhotoReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UploadProfilePhotoReq().decode(pdu.getPbBody());
  }
}
