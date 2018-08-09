import { Document } from 'mongoose';
import { ObjectId } from 'bson';

export interface IDomainUser extends Document {
  _id: ObjectId;
  domain: string;
  name: string;
  fullString: string;
  personId: ObjectId;
}
