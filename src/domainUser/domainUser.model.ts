import * as mongoose from 'mongoose';
import { IDomainUser } from './domainUser.interface';
import { DomainSeperator } from '../utils';
import { DOMAIN_MAP } from '../config/db-enums';

const ObjectId = mongoose.Schema.Types.ObjectId;
const domainMap : Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));

const schemaOptions = {
  toObject: {
    virtuals: true,
    versionKey: false,
  },
  toJSON: {
    virtuals: true,
    versionKey:false,
  },
  collation: {
    locale:'en',
    strength: 1,
  },
};

export const DomainUserSchema = new mongoose.Schema({
  domain: {
    type: String,
    enum: { values: [...domainMap.keys()], message: 'The "{VALUE}" is not a recognized domain' },    
    required: [true, 'User must belong to a domain'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'User must have a name'],
    index: true,
  },
  personId: {
    type: ObjectId,
    ref: 'Person',
    // required: [true, 'User must belong to a person'],
  },
}, schemaOptions);

DomainUserSchema.index({ name: 1, domain: 1 }, { unique: true });

DomainUserSchema.virtual('uniqueID').get(function () {
  return `${this.name}${DomainSeperator}${this.domain}`;
});

DomainUserSchema.virtual('adfsUID').get(function () {
  return `${this.name}${DomainSeperator}${domainMap.get(this.domain)}`;
});

/* maybe we will use it in the future
DomainUserSchema.statics.transformToString = function (doc: any) {
  console.log('user toString', doc.uniqueID);
  return doc.uniqueID;
};
*/
export const DomainUserModel = mongoose.model<IDomainUser & mongoose.Document>('DomainUser', 
  DomainUserSchema);
