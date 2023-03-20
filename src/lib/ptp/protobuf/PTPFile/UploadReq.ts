import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UploadReq_Type } from './types';

export default class UploadReq extends BaseMsg {
  constructor(msg?: UploadReq_Type) {
    super('PTP.File.UploadReq', msg);
    this.setCommandId(ActionCommands.CID_UploadReq);
  }
  decode(data: Uint8Array): UploadReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UploadReq().decode(pdu.getPbBody());
  }
}
