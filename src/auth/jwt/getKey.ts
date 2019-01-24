import { AxiosRequestConfig, default as axios } from 'axios';
import { Agent } from 'https';

const instanceConfig: AxiosRequestConfig = {
  baseURL: `${process.env.JWT_PUBLIC_KEY_BASE_URL}:${process.env.JWT_PUBLIC_KEY_PORT}`,
  httpsAgent: new Agent({ rejectUnauthorized: false }), // only for development
};

const axiosInstance = axios.create(instanceConfig);

let publicKey: string = null;

/**
 * (async) callback function that calls 'done()' with the public key (pem) of the auth server
 * @param request 
 * @param rawJwtToken 
 * @param done 
 */
export async function getJWTPublicKey(request: any, rawJwtToken: string, done: (err: Error, pubKey: any) => void) {
  if (publicKey) {
    return done(null, publicKey);
  }
  try {
    const res: string = (await axiosInstance.get(process.env.JWT_PUBLIC_KEY_PATH)).data;
    if (typeof res !== 'string') { console.log('public key type:', typeof res); }
    publicKey = res;
    console.log('pubKey:', publicKey);
    console.log('rawToken:', rawJwtToken);
    done(null, res);
  } catch (err) {
    done(err, null);
  }
}
