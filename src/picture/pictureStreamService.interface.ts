import { Readable } from 'stream';

export interface PictureStreamService {
  getPicture(path: string) : Promise<Readable>;
}
