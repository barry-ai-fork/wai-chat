import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { MsgUpdateReq_Type } from './types';

export default class MsgUpdateReq extends BaseMsg {
  constructor(msg?: MsgUpdateReq_Type) {
    super('PTP.Msg.MsgUpdateReq', msg);
    this.setCommandId(ActionCommands.CID_MsgUpdateReq);
  }
  decode(data: Uint8Array): MsgUpdateReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new MsgUpdateReq().decode(pdu.getPbBody());
  }
}
