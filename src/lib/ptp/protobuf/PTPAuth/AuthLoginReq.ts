import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthLoginReq_Type } from './types';

export default class AuthLoginReq extends BaseMsg {
  constructor(msg?: AuthLoginReq_Type) {
    super('PTP.Auth.AuthLoginReq', msg);
    this.setCommandId(ActionCommands.CID_AuthLoginReq);
  }
  decode(data: Uint8Array): AuthLoginReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthLoginReq().decode(pdu.getPbBody());
  }
}
