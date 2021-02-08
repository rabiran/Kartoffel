import * as Minio from 'minio';
import client from './client';
import { PictureStreamService } from '../picture/pictureStreamService.interface';
import { Readable } from 'stream';

export class MinioStreamService implements PictureStreamService {
  constructor(private client : Minio.Client, private config: { bucket: string }) {
    console.log('hi');
  }

  getPicture(path : string) : Promise<Readable> {
    return this.client.getObject(this.config.bucket, path);
  }
}

export default new MinioStreamService(client, { bucket: 'aka' });
