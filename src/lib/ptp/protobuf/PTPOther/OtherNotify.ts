import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { OtherNotify_Type } from './types';

export default class OtherNotify extends BaseMsg {
  constructor(msg?: OtherNotify_Type) {
    super('PTP.Other.OtherNotify', msg);
    this.setCommandId(ActionCommands.CID_OtherNotify);
  }
  decode(data: Uint8Array): OtherNotify_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new OtherNotify().decode(pdu.getPbBody());
  }
}
