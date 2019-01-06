import { Types } from 'mongoose';
import { IPerson } from '../person/person.interface';

export interface IDomainUser {
  id?: string;
  domain: string;
  name: string;
  fullString?: string;
  UID?: string;
  personId?: Types.ObjectId | string | IPerson;
}
