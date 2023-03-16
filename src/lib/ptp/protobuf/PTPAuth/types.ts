// DO NOT EDIT
import type * as PTPCommon from '../PTPCommon';

export interface AuthLoginReq_Type {
  sign: Buffer;
  ts: number;
  uid: string;
  address: string;
}
export interface AuthLoginRes_Type {
  err: PTPCommon.ERR;
}
export interface AuthPreLoginReq_Type {
  sign1: Buffer;
  address1: string;
  sign2: Buffer;
  address2: string;
  ts: number;
}
export interface AuthPreLoginRes_Type {
  uid: string;
  ts: number;
  err: PTPCommon.ERR;
}
export interface AuthStep1Req_Type {
  p: Buffer;
}
export interface AuthStep1Res_Type {
  q: Buffer;
  address: string;
  sign: Buffer;
  ts: number;
  err: PTPCommon.ERR;
}
export interface AuthStep2Req_Type {
  ts: number;
  address: string;
  sign: Buffer;
}
export interface AuthStep2Res_Type {
  err: PTPCommon.ERR;
}
