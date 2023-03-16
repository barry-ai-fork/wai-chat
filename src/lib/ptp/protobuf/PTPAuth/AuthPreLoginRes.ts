import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthPreLoginRes_Type } from './types';

export default class AuthPreLoginRes extends BaseMsg {
  constructor(msg?: AuthPreLoginRes_Type) {
    super('PTP.Auth.AuthPreLoginRes', msg);
    this.setCommandId(ActionCommands.CID_AuthPreLoginRes);
  }
  decode(data: Uint8Array): AuthPreLoginRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthPreLoginRes().decode(pdu.getPbBody());
  }
}
