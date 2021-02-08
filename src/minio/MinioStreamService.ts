import * as Minio from 'minio';
import client from './client';
import { PictureStreamService } from '../picture/pictureStreamService.interface';
import { Readable } from 'stream';
import { config } from '../config/config';

const { bucket } = config.minio;

export class MinioStreamService implements PictureStreamService {
  constructor(private client : Minio.Client, private config: { bucket: string }) {}

  getPicture(path : string) : Promise<Readable> {
    return this.client.getObject(this.config.bucket, path);
  }
}

export default new MinioStreamService(client, { bucket });
