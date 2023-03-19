import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { MsgListRes_Type } from './types';

export default class MsgListRes extends BaseMsg {
  constructor(msg?: MsgListRes_Type) {
    super('PTP.Msg.MsgListRes', msg);
    this.setCommandId(ActionCommands.CID_MsgListRes);
  }
  decode(data: Uint8Array): MsgListRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new MsgListRes().decode(pdu.getPbBody());
  }
}
