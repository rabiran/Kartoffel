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
  if (publicKey) { // we already got the public key
    return done(null, publicKey);
  }
  try { // request the public key from the auth server
    const res: string = (await axiosInstance.get(process.env.JWT_PUBLIC_KEY_PATH)).data;
    publicKey = res; // save it for future calls
    done(null, res);
  } catch (err) {
    done(err, null);
  }
}
