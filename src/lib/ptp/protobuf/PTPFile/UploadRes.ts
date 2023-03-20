import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UploadRes_Type } from './types';

export default class UploadRes extends BaseMsg {
  constructor(msg?: UploadRes_Type) {
    super('PTP.File.UploadRes', msg);
    this.setCommandId(ActionCommands.CID_UploadRes);
  }
  decode(data: Uint8Array): UploadRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UploadRes().decode(pdu.getPbBody());
  }
}
