import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UploadProfilePhotoRes_Type } from './types';

export default class UploadProfilePhotoRes extends BaseMsg {
  constructor(msg?: UploadProfilePhotoRes_Type) {
    super('PTP.Auth.UploadProfilePhotoRes', msg);
    this.setCommandId(ActionCommands.CID_UploadProfilePhotoRes);
  }
  decode(data: Uint8Array): UploadProfilePhotoRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UploadProfilePhotoRes().decode(pdu.getPbBody());
  }
}
