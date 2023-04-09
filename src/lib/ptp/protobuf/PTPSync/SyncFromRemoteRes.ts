import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SyncFromRemoteRes_Type } from './types';

export default class SyncFromRemoteRes extends BaseMsg {
  public msg?: SyncFromRemoteRes_Type
  constructor(msg?: SyncFromRemoteRes_Type) {
    super('PTP.Sync.SyncFromRemoteRes', msg);
    this.setCommandId(ActionCommands.CID_SyncFromRemoteRes);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): SyncFromRemoteRes_Type {
    return new SyncFromRemoteRes().decode(pdu.body());
  }
}
