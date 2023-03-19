import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { MsgDeleteRes_Type } from './types';

export default class MsgDeleteRes extends BaseMsg {
  constructor(msg?: MsgDeleteRes_Type) {
    super('PTP.Msg.MsgDeleteRes', msg);
    this.setCommandId(ActionCommands.CID_MsgDeleteRes);
  }
  decode(data: Uint8Array): MsgDeleteRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new MsgDeleteRes().decode(pdu.getPbBody());
  }
}
