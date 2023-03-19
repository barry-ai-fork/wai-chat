import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { MsgDeleteReq_Type } from './types';

export default class MsgDeleteReq extends BaseMsg {
  constructor(msg?: MsgDeleteReq_Type) {
    super('PTP.Msg.MsgDeleteReq', msg);
    this.setCommandId(ActionCommands.CID_MsgDeleteReq);
  }
  decode(data: Uint8Array): MsgDeleteReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new MsgDeleteReq().decode(pdu.getPbBody());
  }
}
