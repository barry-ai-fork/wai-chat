import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthPreLoginReq_Type } from './types';

export default class AuthPreLoginReq extends BaseMsg {
  constructor(msg?: AuthPreLoginReq_Type) {
    super('PTP.Auth.AuthPreLoginReq', msg);
    this.setCommandId(ActionCommands.CID_AuthPreLoginReq);
  }
  decode(data: Uint8Array): AuthPreLoginReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthPreLoginReq().decode(pdu.getPbBody());
  }
}
