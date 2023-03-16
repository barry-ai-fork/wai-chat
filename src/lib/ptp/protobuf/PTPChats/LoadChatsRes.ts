import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { LoadChatsRes_Type } from './types';

export default class LoadChatsRes extends BaseMsg {
  constructor(msg?: LoadChatsRes_Type) {
    super('PTP.Chats.LoadChatsRes', msg);
    this.setCommandId(ActionCommands.CID_LoadChatsRes);
  }
  decode(data: Uint8Array): LoadChatsRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new LoadChatsRes().decode(pdu.getPbBody());
  }
}
