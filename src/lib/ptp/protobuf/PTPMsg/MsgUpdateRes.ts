import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { MsgUpdateRes_Type } from './types';

export default class MsgUpdateRes extends BaseMsg {
  constructor(msg?: MsgUpdateRes_Type) {
    super('PTP.Msg.MsgUpdateRes', msg);
    this.setCommandId(ActionCommands.CID_MsgUpdateRes);
  }
  decode(data: Uint8Array): MsgUpdateRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new MsgUpdateRes().decode(pdu.getPbBody());
  }
}
