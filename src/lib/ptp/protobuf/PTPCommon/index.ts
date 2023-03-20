// DO NOT EDIT
import BaseMsg from '../BaseMsg';
import type { Pdu } from '../BaseMsg';

export enum AUTH_TYPE {
  AUTH_TYPE_USERNAME = 0,
  AUTH_TYPE_EMAIL = 1,
  AUTH_TYPE_MOBILE = 2,
}

export enum ERR {
  NO_ERROR = 0,
  ERR_SYSTEM = 1,
  ERR_AUTH_LOGIN = 2,
}

export interface FileInfo_Type {
  id: string;
  size: number;
  part: number;
  part_total?: number;
  buf: Buffer;
  type: string;
}

import { ActionCommands } from '../ActionCommands';
export class FileInfo extends BaseMsg {
  constructor(msg?: FileInfo_Type) {
    super('PTP.Common.FileInfo', msg);
    this.setCommandId(ActionCommands.CID_FileInfo);
  }
  decode(data: Uint8Array): FileInfo_Type {
    return this.__D(data);
  }
  pack(): Pdu {
    return this.__pack();
  }
  static parseMsg(pdu : Pdu) {
    return new FileInfo().decode(pdu.getPbBody());
  }
}
