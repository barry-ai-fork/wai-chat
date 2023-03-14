import {encode} from "worktop/buffer";

export function bufferToString(buffer: Buffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buffer))
}

export function stringToBuffer(str:String) {
  return str;
}


export function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
