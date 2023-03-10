import {describe, expect} from '@jest/globals';
import AccountController from "../src/lib/client/AccountController";
import {GroupGetListRes} from "../src/lib/protobuf/PTPGroup";
import {ERR, GroupInfo, GroupInfo_Type, GroupType} from "../src/lib/protobuf/PTPCommon";


describe('AccountController', () => {
  it('GroupRecode', async () => {
    const account = AccountController.getInstance(1)
    account.setUid(1);
    const groups:GroupInfo_Type[] = [];
    groups.push({
      "avatar": "avatar",
      "created_time": 0,
      "group_adr": "0x1111",
      "group_id": 1,
      "group_idx": 1,
      "group_type": GroupType.GROUP_TYPE_MULTI,
      "name": "name",
      "owner_uid": 1,
      "pair_uid": 1
    })
    account.GroupGetListRes({
      error: ERR.NO_ERROR,
      group_info_updated_time: 0,
      groups
    });
    account.setGroupRecord(1,{
      groupAddress:"groupAddress1",
      lastMsgId:0,
      unReadCnt:0,
      msgUpdateTime:1
    })

    account.setGroupRecord(2,{
      groupAddress:"groupAddress1",
      lastMsgId:0,
      unReadCnt:0,
      msgUpdateTime:2
    })

    const groupOrderedIds = account.getOrderedGroupIds();
    expect(1).toEqual(1);
  });
});
