import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthLoginRes_Type } from './types';

export default class AuthLoginRes extends BaseMsg {
  constructor(msg?: AuthLoginRes_Type) {
    super('PTP.Auth.AuthLoginRes', msg);
    this.setCommandId(ActionCommands.CID_AuthLoginRes);
  }
  decode(data: Uint8Array): AuthLoginRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthLoginRes().decode(pdu.getPbBody());
  }
}
