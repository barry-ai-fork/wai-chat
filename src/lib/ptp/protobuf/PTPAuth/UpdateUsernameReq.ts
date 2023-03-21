import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UpdateUsernameReq_Type } from './types';

export default class UpdateUsernameReq extends BaseMsg {
  constructor(msg?: UpdateUsernameReq_Type) {
    super('PTP.Auth.UpdateUsernameReq', msg);
    this.setCommandId(ActionCommands.CID_UpdateUsernameReq);
  }
  decode(data: Uint8Array): UpdateUsernameReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UpdateUsernameReq().decode(pdu.getPbBody());
  }
}
