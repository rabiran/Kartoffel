import * as Minio from 'minio';
import { config } from '../config/config';

const { endPoint, port, secretKey, accessKey, useSSL } = config.minio;

export default new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});
