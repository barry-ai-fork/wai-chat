// DO NOT EDIT
import type * as PTPCommon from '../PTPCommon';

export interface DownloadReq_Type {
  id: string;
}
export interface DownloadRes_Type {
  file?: PTPCommon.FileInfo_Type;
  err: PTPCommon.ERR;
}
export interface UploadReq_Type {
  file: PTPCommon.FileInfo_Type;
}
export interface UploadRes_Type {
  err: PTPCommon.ERR;
}
