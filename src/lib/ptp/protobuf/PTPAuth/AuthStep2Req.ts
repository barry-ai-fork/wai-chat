import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthStep2Req_Type } from './types';

export default class AuthStep2Req extends BaseMsg {
  constructor(msg?: AuthStep2Req_Type) {
    super('PTP.Auth.AuthStep2Req', msg);
    this.setCommandId(ActionCommands.CID_AuthStep2Req);
  }
  decode(data: Uint8Array): AuthStep2Req_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthStep2Req().decode(pdu.getPbBody());
  }
}
