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

  ERR_AUTH_LOGIN = 1,
}

