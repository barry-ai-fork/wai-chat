import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { SyncToRemoteRes_Type } from './types';

export default class SyncToRemoteRes extends BaseMsg {
  public msg?: SyncToRemoteRes_Type
  constructor(msg?: SyncToRemoteRes_Type) {
    super('PTP.Sync.SyncToRemoteRes', msg);
    this.setCommandId(ActionCommands.CID_SyncToRemoteRes);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): SyncToRemoteRes_Type {
    return new SyncToRemoteRes().decode(pdu.body());
  }
}
