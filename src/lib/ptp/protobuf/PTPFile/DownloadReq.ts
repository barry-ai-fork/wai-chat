import BaseMsg from '../BaseMsg';
import { ActionCommands } from '../ActionCommands';
import type { Pdu } from '../BaseMsg';
import type { DownloadReq_Type } from './types';

export default class DownloadReq extends BaseMsg {
  constructor(msg?: DownloadReq_Type) {
    super('PTP.File.DownloadReq', msg);
    this.setCommandId(ActionCommands.CID_DownloadReq);
  }
  decode(data: Uint8Array): DownloadReq_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new DownloadReq().decode(pdu.getPbBody());
  }
}
