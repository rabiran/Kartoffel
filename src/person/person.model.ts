import * as mongoose from 'mongoose';
import { IPerson, IDomainUser } from './person.interface';
import { PersonValidate } from './person.validate';
import  * as consts  from '../config/db-enums';
import { registerErrorHandlingHooks } from '../helpers/mongooseErrorConvert';
import { DomainSeperator, filterObjectByKeys, domainMap } from '../utils';

(<any>mongoose).Promise = Promise;
const ObjectId = mongoose.Schema.Types.ObjectId;

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


const DomainUserSchema = new mongoose.Schema(
  {
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
    dataSource: {
      type: String,
      required: [true, 'DataSource is required for domainUser'],
      enum: { values: consts.DATA_SOURCE , message: '"{VALUE}" is not a valid dataSource' },
      index: true,
    },
  },
  {
    toObject: {
      virtuals: true,
      versionKey: false,
      transform:  (doc, ret, options) => {
        const filtered = filterObjectByKeys(ret, ['uniqueID', 'adfsUID', 'dataSource']);
        !PersonValidate.isLegalUserString((<IDomainUser>filtered).adfsUID) && delete (<IDomainUser>filtered).adfsUID;
        return filtered;
      },
    },
    toJSON: {
      virtuals: true,
      versionKey:false,
    },
    collation: {
      locale:'en',
      strength: 1,
    },
  }
);
DomainUserSchema.index({ domain: 1, name: 1 }, { unique: true, sparse: true });
DomainUserSchema.virtual('uniqueID').get(function () {
  return `${this.name}${DomainSeperator}${this.domain}`;
});

DomainUserSchema.virtual('adfsUID').get(function () {
  return `${this.name}${DomainSeperator}${domainMap.get(this.domain)}`;
});

registerErrorHandlingHooks(DomainUserSchema);

export const PersonSchema = new mongoose.Schema(
  {
    identityCard: {
      type: String,
      unique: true,
      sparse: true,
      validate: { validator: PersonValidate.identityCard, message: '{VALUE} is an invalid identity card!' },
    },
    personalNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: { validator: PersonValidate.personalNumber, message: '{VALUE} is an invalid personal number!' },
    },
    domainUsers: [DomainUserSchema],
    entityType: {
      type: String,
      enum: consts.ENTITY_TYPE,
      required: [true, 'You must enter entity type'],
    },
    serviceType: {
      type: String,
      enum: { values: consts.SERVICE_TYPE , message: 'The "{VALUE}" is not a recognized service type' },
    },
    firstName: {
      type: String,
      required: [true, 'You must enter a first name!'],
      validate: { validator: PersonValidate.namePart, message: '{VALUE} is an invalid First Name' },
    },
    lastName: {
      type: String,
      validate: { validator: PersonValidate.namePart, message: '{VALUE} is an invalid Last Name' },
    },
    currentUnit: {
      type: String,
      enum: consts.CURRENT_UNIT,
    },
    status: {
      type: String,
      enum: consts.STATUS,
      default: consts.STATUS[0],
    },
    dischargeDay: {
      type: Date,
    },
    hierarchy: {
      type: [String],
      required: [function () { return this.status === consts.STATUS[0]; }, 'You must enter a hierarchy!'],
      default: undefined,
    },
    job: {
      type: String,
      default: '',
    },
    directGroup: {
      type: ObjectId,
      required: [true, 'a person must belong to an organization group'],
      index: true,
    },
    managedGroup: {
      type: ObjectId,
      index: true,
    },
    responsibility: {
      type: String,
      enum: consts.RESPONSIBILITY,
      default: consts.RESPONSIBILITY[0],
    },
    responsibilityLocation: {
      type: ObjectId,
    },

    mail: {
      type: String,
      validate: { validator: PersonValidate.email, message: '{VALUE} is not a valid email address!' },
    },
    phone: [{
      type: String,
      validate: { validator: PersonValidate.phone, message: '{VALUE} is not a valid phone number!' },
    }],

    mobilePhone: [{
      type: String,
      validate: { validator: PersonValidate.mobilePhone, message: '{VALUE} is not a valid mobile phone number!' },
    }],
    rank: {
      type: String,
      enum: consts.RANK.concat([null]),
    },
    address: String,

    clearance: {
      type: String,
      default: '0',
      validate: { validator: PersonValidate.clearance, message: '{VALUE} is an invalid clearance!' },
    },
  },
  schemaOptions
);

PersonSchema.set('timestamps', true);

PersonSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

registerErrorHandlingHooks(PersonSchema);

export const PersonModel = mongoose.model<IPerson & mongoose.Document>('Person', PersonSchema);
