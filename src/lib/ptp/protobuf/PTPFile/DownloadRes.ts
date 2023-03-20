import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { DownloadRes_Type } from './types';

export default class DownloadRes extends BaseMsg {
  constructor(msg?: DownloadRes_Type) {
    super('PTP.File.DownloadRes', msg);
    this.setCommandId(ActionCommands.CID_DownloadRes);
  }
  decode(data: Uint8Array): DownloadRes_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new DownloadRes().decode(pdu.getPbBody());
  }
}
