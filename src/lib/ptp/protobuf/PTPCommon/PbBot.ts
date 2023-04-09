// DO NOT EDIT
import BaseMsg from '../BaseMsg';
import type { Pdu } from '../BaseMsg';
import type { PbBot_Type } from './types';

export default class PbBot extends BaseMsg {
  public msg?: PbBot_Type
  constructor(msg?: PbBot_Type) {
    super('PTP.Common.PbBot', msg);
    this.msg = msg;
  }
  static parseMsg(pdu : Pdu): PbBot_Type {
    return new PbBot().decode(pdu.body());
  }
}
