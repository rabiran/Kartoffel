import * as Minio from 'minio';
import client from './client';
import { PictureStreamService } from '../picture/pictureStreamService.interface';

export class MinioStreamService implements PictureStreamService {

    constructor(private client : Minio.Client, private config: { bucket: string }) {
        console.log('hi');
    }

    getPicture(path : string) {
        return this.client.getObject(this.config.bucket, path);
    }
}

export default new MinioStreamService(client, { bucket: 'aka' });
