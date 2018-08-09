import * as mongoose from 'mongoose';
import { IDomainUser } from './domainUser.interface';
const ObjectId = mongoose.Schema.Types.ObjectId;


export const DomainUserSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: [true, 'User must belong to a domain'],
  },
  name: {
    type: String,
    required: [true, 'User must have a name'],
  },
  personId: {
    type: ObjectId,
    ref: 'Person',
    required: [true, 'User must belong to a person'],
  },
});

DomainUserSchema.virtual('fullString').get(function () {
  return `${this.name}@${this.domain}`;
});

export const DomainUserModel = mongoose.model<IDomainUser>('DomainUser', DomainUserSchema);
