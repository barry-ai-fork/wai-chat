import {expect} from '@jest/globals';
import LocalFile from "./LocalFile";

test('kv TEST', async () => {
  const dbName = "54657f7b0ceb4e958590eb925e5f95ec";
  const kv = new LocalFile();
  await kv.init(dbName,"/tmp");

  const value = "test";
  await kv.put("key",value)
  await kv.put("key1",value)

  const keys = await kv.list({prefix:"key"})
  expect(keys.length).toBe(2);

  const keys1 = await kv.list({prefix:"1key"})
  expect(keys1.length).toBe(0);

  const value1 = await kv.get("key");
  expect(value).toBe(value1);
  await kv.delete("key");

  const keys2 = await kv.list({prefix:"key"})
  expect(keys2.length).toBe(1);

});
