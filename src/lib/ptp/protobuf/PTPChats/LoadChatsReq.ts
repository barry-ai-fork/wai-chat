import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { LoadChatsReq_Type } from './types';

export default class LoadChatsReq extends BaseMsg {
  constructor(msg?: LoadChatsReq_Type) {
    super('PTP.Chats.LoadChatsReq', msg);
    this.setCommandId(ActionCommands.CID_LoadChatsReq);
  }
  decode(data: Uint8Array): LoadChatsReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new LoadChatsReq().decode(pdu.getPbBody());
  }
}
