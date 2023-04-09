import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SyncMessagesRes_Type } from './types';

export default class SyncMessagesRes extends BaseMsg {
  public msg?: SyncMessagesRes_Type
  constructor(msg?: SyncMessagesRes_Type) {
    super('PTP.Msg.SyncMessagesRes', msg);
    this.setCommandId(ActionCommands.CID_SyncMessagesRes);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): SyncMessagesRes_Type {
    return new SyncMessagesRes().decode(pdu.body());
  }
}
