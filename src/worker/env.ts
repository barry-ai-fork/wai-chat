import CloudFlareKv from './share/db/CloudFlareKv';
import CloudFlareR2 from './share/storage/CloudFlareR2';
import LocalStorage from './share/db/LocalStorage';
import Logger from './share/cls/Logger';

export const ENV: {
	IS_PROD: boolean;
  KV_NAMESPACE_BINDING_KEY: string;
  R2_STORAGE_BINDING_KEY: string;
  USER_ID_START: string;
  WAI_WORKER_API_TOKEN:String;
	Access_Control_Allow_Origin: string;
  MEDIA_ENCRYPT_KEY_32_BITS: string;
  MEDIA_ENCRYPT_IV_16_BITS: string;
  MEDIA_ENCRYPT_AAD_16_BITS: string;
} = {
	IS_PROD: true,
  KV_NAMESPACE_BINDING_KEY: 'DATABASE',
  R2_STORAGE_BINDING_KEY:"STORAGE",
  USER_ID_START: '623415',
  WAI_WORKER_API_TOKEN:"",
	Access_Control_Allow_Origin: '*',
  MEDIA_ENCRYPT_KEY_32_BITS: 'dac1c203d20fe98fb8d48d2e171e4234917cc60bcd410ef8aee6b267a3256fc1',
  MEDIA_ENCRYPT_IV_16_BITS:"dc9ac78d37ceac1d7604333f17964e81",
  MEDIA_ENCRYPT_AAD_16_BITS: 'dc9ac78d37ceac1d7604333f17964e81',
};

export let kv: CloudFlareKv;
export let storage: CloudFlareR2;

export function initEnv(env: Record<string, any>) {
	for (const key in ENV) {
		if (env[key] !== undefined) {
			// @ts-ignore
			ENV[key] = env[key];
		}
	}
	// Logger.setLevel(ENV.IS_PROD ? 'info' : 'debug');
	Logger.setLevel(ENV.IS_PROD ? 'debug' : 'debug');
	kv = new CloudFlareKv();
	kv.init(env[ENV.KV_NAMESPACE_BINDING_KEY]);
	storage = new CloudFlareR2();
	storage.init(env[ENV.R2_STORAGE_BINDING_KEY]);
}

export function initKvTest() {
	//@ts-ignore
	kv = new LocalStorage();
	//@ts-ignore
	kv.init();
}
