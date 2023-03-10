import { describe, expect } from '@jest/globals';
import Helpers from "../src/lib/gramjs/Helpers";

describe('utils test', () => {
  it('test1', async () => {
    let bytes = Helpers.generateRandomBytes(16);

    const nonce = Helpers.readBigIntFromBuffer(bytes, false, true);

    expect(1).toEqual(1);
  });
});
