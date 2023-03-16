import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { AuthStep2Res_Type } from './types';

export default class AuthStep2Res extends BaseMsg {
  constructor(msg?: AuthStep2Res_Type) {
    super('PTP.Auth.AuthStep2Res', msg);
    this.setCommandId(ActionCommands.CID_AuthStep2Res);
  }
  decode(data: Uint8Array): AuthStep2Res_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new AuthStep2Res().decode(pdu.getPbBody());
  }
}
