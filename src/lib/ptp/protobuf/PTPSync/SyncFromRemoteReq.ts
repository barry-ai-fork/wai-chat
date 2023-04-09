import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SyncFromRemoteReq_Type } from './types';

export default class SyncFromRemoteReq extends BaseMsg {
  public msg?: SyncFromRemoteReq_Type
  constructor(msg?: SyncFromRemoteReq_Type) {
    super('PTP.Sync.SyncFromRemoteReq', msg);
    this.setCommandId(ActionCommands.CID_SyncFromRemoteReq);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): SyncFromRemoteReq_Type {
    return new SyncFromRemoteReq().decode(pdu.body());
  }
}
