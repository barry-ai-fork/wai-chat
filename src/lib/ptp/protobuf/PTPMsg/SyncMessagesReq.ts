import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SyncMessagesReq_Type } from './types';

export default class SyncMessagesReq extends BaseMsg {
  public msg?: SyncMessagesReq_Type
  constructor(msg?: SyncMessagesReq_Type) {
    super('PTP.Msg.SyncMessagesReq', msg);
    this.setCommandId(ActionCommands.CID_SyncMessagesReq);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): SyncMessagesReq_Type {
    return new SyncMessagesReq().decode(pdu.body());
  }
}
