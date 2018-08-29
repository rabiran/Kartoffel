import * as mongoose from 'mongoose';
import { IDomainUser } from './domainUser.interface';
import { DomainSeperator } from './domainUser.utils';

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
    // required: [true, 'User must belong to a person'],
  },
});

// don't know if this is a good solution:
// DomainUserSchema.index({'name':1, 'domain':1}, {unique: true});

DomainUserSchema.virtual('fullString').get(function () {
  return `${this.name}${DomainSeperator}${this.domain}`;
});

export const DomainUserModel = mongoose.model<IDomainUser & mongoose.Document>('DomainUser', 
  DomainUserSchema);
