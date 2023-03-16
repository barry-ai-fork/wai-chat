let dbPrefixVersion: string = 'v2.0.17';

export interface ConfigType {
  errMsg: {
    E_USERNAME_EXISTS: string;
    E_REASON_NO_DB_SERVER: string;
  };
  siteTitle: string;
  clientVersion: string;
  im: {
    maxLoadMsgCnt: number;
    msfsServer: string;
  };
  msgServer: {
    loginApi: string;
    wsUrl: string;
    msfsUrl: string;
  };
  dbPrefix: {
    Sessions: string;
    Msg: string;
    MsgSending: string;
    MsgIds: string;
    User: string;
    Account: string;
    Key: string;
    Accounts: string;
    Group: string;
    GroupRecord: string;
    GroupIds: string;
    GroupLastMsgId: string;
    GroupUnReadCnt: string;
    GroupSelectedId: string;
    GroupInfoUpdatedTime: string;
    GroupMembersUpdatedTime: string;
    BuddyUpdatedTime: string;
  };
}

const Config: ConfigType = {
  errMsg: {
    E_USERNAME_EXISTS: '用户名已存在',
    E_REASON_NO_DB_SERVER: '系统错误，请稍后再试',
  },
  clientVersion: 'ptp.v1',
  im: {
    maxLoadMsgCnt: 20,
    msfsServer: 'http://192.168.43.244:7841',
  },
  siteTitle: '柚子',
  msgServer: {
    msfsUrl:"http://127.0.0.1:7841",
    wsUrl: 'ws://127.0.0.1:7871',
    // wsUrl: 'ws://192.168.43.244:7881',
    loginApi: 'http://192.168.43.244:7832/msg_server',
  },
  dbPrefix: {
    Msg: `M_`,
    MsgSending: `MSI_`,
    MsgIds: `MS_`,
    User: `U_`,
    Key: `K_`,
    Account: `A_`,
    Group: `G_`,
    Accounts: `${dbPrefixVersion}_AS_`,
    GroupRecord: `${dbPrefixVersion}_GR_1_`,
    GroupLastMsgId: `${dbPrefixVersion}_GRL_1_`,
    GroupUnReadCnt: `${dbPrefixVersion}_GRU_1_`,
    GroupIds: `${dbPrefixVersion}_GIS_`,
    Sessions: `${dbPrefixVersion}_SS_`,
    GroupInfoUpdatedTime: `${dbPrefixVersion}_GIUT_1_`,
    GroupMembersUpdatedTime: `${dbPrefixVersion}_GMUT_1_`,
    BuddyUpdatedTime: `${dbPrefixVersion}_BUT_1_`,
    GroupSelectedId: `${dbPrefixVersion}_GroupSelectedId_`,
  },
};


export const getMsgLocalKey = ({
                                 group_id,
                                 msg_id,
                               }: {
  group_id: number;
  msg_id: number;
}) => {
  return `${Config.dbPrefix.Msg}${group_id}_${msg_id}`;
};

export const getUserLocalKey = ({ uid }: { uid: number }) => {
  return `${Config.dbPrefix.User}${uid}`;
};

export const getGroupLocalKey = ({ group_id }: { group_id: number }) => {
  return `${Config.dbPrefix.Group}${group_id}`;
};

export const getGroupIdsKey = () => {
  return `${Config.dbPrefix.GroupIds}`;
};

export const getGroupRecordLocalKey = ({ group_id }: { group_id: number }) => {
  return `${Config.dbPrefix.GroupRecord}${group_id}`;
};

export default Config;
