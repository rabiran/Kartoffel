import { KartoffelModel as Kartoffel } from './kartoffel.model';
import * as mongoose from 'mongoose';
import { IKartoffel } from './kartoffel.interface';
import { RepositoryBase } from '../../helpers/repository';

const ObjectId = mongoose.Types.ObjectId;

export class KartoffelRepository extends RepositoryBase<IKartoffel> {
  constructor() {
    super(Kartoffel);
  }
  getOffsprings(ancestor_id: string): Promise<mongoose.Document[]> {
    return Kartoffel.find({ ancestors: ObjectId(ancestor_id) }).exec();
  }
}
