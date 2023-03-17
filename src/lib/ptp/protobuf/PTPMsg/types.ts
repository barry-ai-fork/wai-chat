// DO NOT EDIT
import type * as PTPCommon from '../PTPCommon';

export interface SendReq_Type {
  payload: string;
}
export interface SendRes_Type {
  action: string;
  payload: string;
  err: PTPCommon.ERR;
}
