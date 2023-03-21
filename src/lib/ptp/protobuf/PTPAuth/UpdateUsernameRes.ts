import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { UpdateUsernameRes_Type } from './types';

export default class UpdateUsernameRes extends BaseMsg {
  constructor(msg?: UpdateUsernameRes_Type) {
    super('PTP.Auth.UpdateUsernameRes', msg);
    this.setCommandId(ActionCommands.CID_UpdateUsernameRes);
  }
  decode(data: Uint8Array): UpdateUsernameRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new UpdateUsernameRes().decode(pdu.getPbBody());
  }
}
