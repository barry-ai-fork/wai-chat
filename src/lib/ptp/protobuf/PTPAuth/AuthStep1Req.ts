import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthStep1Req_Type } from './types';

export default class AuthStep1Req extends BaseMsg {
  constructor(msg?: AuthStep1Req_Type) {
    super('PTP.Auth.AuthStep1Req', msg);
    this.setCommandId(ActionCommands.CID_AuthStep1Req);
  }
  decode(data: Uint8Array): AuthStep1Req_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthStep1Req().decode(pdu.getPbBody());
  }
}
