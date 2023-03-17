import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SendReq_Type } from './types';

export default class SendReq extends BaseMsg {
  constructor(msg?: SendReq_Type) {
    super('PTP.Msg.SendReq', msg);
    this.setCommandId(ActionCommands.CID_SendReq);
  }
  decode(data: Uint8Array): SendReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new SendReq().decode(pdu.getPbBody());
  }
}
