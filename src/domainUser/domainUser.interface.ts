import { Types } from 'mongoose';
import { IPerson } from '../person/person.interface';

export interface IDomainUser {
  id?: string;
  domain: string;
  name: string;
  uniqueID?: string;
  adfsUID?: string;
  personId?: Types.ObjectId | string | IPerson;
}
