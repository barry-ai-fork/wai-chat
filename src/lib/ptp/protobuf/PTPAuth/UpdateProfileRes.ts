import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UpdateProfileRes_Type } from './types';

export default class UpdateProfileRes extends BaseMsg {
  constructor(msg?: UpdateProfileRes_Type) {
    super('PTP.Auth.UpdateProfileRes', msg);
    this.setCommandId(ActionCommands.CID_UpdateProfileRes);
  }
  decode(data: Uint8Array): UpdateProfileRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UpdateProfileRes().decode(pdu.getPbBody());
  }
}
