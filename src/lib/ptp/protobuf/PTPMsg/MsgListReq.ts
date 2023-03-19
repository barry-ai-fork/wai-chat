import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { MsgListReq_Type } from './types';

export default class MsgListReq extends BaseMsg {
  constructor(msg?: MsgListReq_Type) {
    super('PTP.Msg.MsgListReq', msg);
    this.setCommandId(ActionCommands.CID_MsgListReq);
  }
  decode(data: Uint8Array): MsgListReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new MsgListReq().decode(pdu.getPbBody());
  }
}
