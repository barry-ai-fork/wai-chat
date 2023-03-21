import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UpdateProfileReq_Type } from './types';

export default class UpdateProfileReq extends BaseMsg {
  constructor(msg?: UpdateProfileReq_Type) {
    super('PTP.Auth.UpdateProfileReq', msg);
    this.setCommandId(ActionCommands.CID_UpdateProfileReq);
  }
  decode(data: Uint8Array): UpdateProfileReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UpdateProfileReq().decode(pdu.getPbBody());
  }
}
