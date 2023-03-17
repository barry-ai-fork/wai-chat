import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SendRes_Type } from './types';

export default class SendRes extends BaseMsg {
  constructor(msg?: SendRes_Type) {
    super('PTP.Msg.SendRes', msg);
    this.setCommandId(ActionCommands.CID_SendRes);
  }
  decode(data: Uint8Array): SendRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new SendRes().decode(pdu.getPbBody());
  }
}
