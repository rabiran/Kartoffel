import { config } from '../../config/config';
import { AxiosRequestConfig, default as axios } from 'axios';
import { Agent } from 'https';

const instanceConfig: AxiosRequestConfig = {
  baseURL: config.auth.jwt.publicKey.baseUrl,
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
  if (publicKey) { // we already got the public key
    return done(null, publicKey);
  }
  try { // request the public key from the auth server
    const res: string = (await axiosInstance.get(config.auth.jwt.publicKey.urlPath)).data;
    publicKey = res; // save it for future calls
    done(null, res);
  } catch (err) {
    done(err, null);
  }
}
