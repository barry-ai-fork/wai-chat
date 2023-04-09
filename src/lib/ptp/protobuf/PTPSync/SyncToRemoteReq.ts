import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SyncToRemoteReq_Type } from './types';

export default class SyncToRemoteReq extends BaseMsg {
  public msg?: SyncToRemoteReq_Type
  constructor(msg?: SyncToRemoteReq_Type) {
    super('PTP.Sync.SyncToRemoteReq', msg);
    this.setCommandId(ActionCommands.CID_SyncToRemoteReq);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): SyncToRemoteReq_Type {
    return new SyncToRemoteReq().decode(pdu.body());
  }
}
