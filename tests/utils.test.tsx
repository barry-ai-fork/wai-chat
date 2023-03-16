import { describe, expect } from '@jest/globals';
import Helpers from "../src/lib/gramjs/Helpers";
import {
  HEADER_LEN,
  popByteBuffer,
  toUint8Array,
  writeBytes,
  writeInt16,
  writeInt32
} from "../src/lib/ptp/protobuf/BaseMsg";

describe('utils test', () => {
  it('generateRandomBytes', async () => {
    let bytes = Helpers.generateRandomBytes(16);

    const nonce = Helpers.readBigIntFromBuffer(bytes, false, true);

    expect(1).toEqual(1);
  });
  it('protobuf', async () => {

    let bb = popByteBuffer();
    const _pbHeader = {
      length: 1,
      version: 0,
      flag: 0,
      command_id:2,
      seq_num: 1,
      reversed:0,
    };
    writeInt32(bb, _pbHeader.length);
    writeInt16(bb, _pbHeader.version);
    writeInt16(bb, _pbHeader.flag);
    writeInt16(bb, _pbHeader.command_id);
    writeInt16(bb, _pbHeader.seq_num);
    writeInt32(bb, _pbHeader.reversed);
    writeBytes(bb, Buffer.from("test"));
    const res1 = toUint8Array(bb);
    bb.offset = 10;
    writeInt16(bb, 2);

    expect(1).toEqual(1);
  });
});
