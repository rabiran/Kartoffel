import * as mongoose from 'mongoose';
import { IPerson, IDomainUser } from './person.interface';
import { PersonValidate } from './person.validate';
import  * as consts  from '../config/db-enums';
import { registerErrorHandlingHooks } from '../helpers/mongooseErrorConvert';
import { DomainSeperator, filterObjectByKeys, domainMap, allStatuses } from '../utils';
import { schema as ProfilePictureSchema } from './picture/profile/';

const SEX_VALUES = [consts.SEX.Male, consts.SEX.Female];

(<any>mongoose).Promise = Promise;
const ObjectId = mongoose.Schema.Types.ObjectId;

const addHierarchyPath = function () {
  const hierarchy : string[] = (this as any).get('hierarchy');
  const hierarchyPath : string[] = [];

  if (hierarchy) {
    hierarchy.forEach((elem: string, index: number) => {
      hierarchyPath[index] = hierarchy.slice(0, index + 1).join('/');
    });
  }

  (this as any).set('hierarchyPath', hierarchyPath);
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
    mail: {
      type: String,
      validate: { validator: PersonValidate.email, message: '{VALUE} is not a valid email address!' },
    },
    hierarchy: {
      type: [String],
      default: undefined,
    },
  },
  {
    toObject: {
      virtuals: true,
      versionKey: false,
      transform:  (doc, ret, options) => {
        const filtered = filterObjectByKeys(ret, ['uniqueID', 'adfsUID', 'dataSource', 'hierarchy', 'mail']);
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
      enum: allStatuses,
      default: consts.STATUS.ACTIVE,
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
    pictures: {
      default: {},
      profile: {
        url: String,
        meta: ProfilePictureSchema,
      },
    },
    sex: {
      type: String,
      enum: SEX_VALUES,
    },
    birthDate: {
      type: Date,
    },
    hierarchyPath: {
      type: [String],
      default: undefined,
    },
  },
  {
    toJSON: {
      virtuals: true,
      versionKey:false,
    },
    collation: {
      locale:'en',
      strength: 1,
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform:  (doc, ret, options) => {
        const { hierarchyPath, ...rest } = ret;
        return rest;
      },
    },
  }
);

PersonSchema.set('timestamps', true);

PersonSchema.virtual('fullName').get(function () {
  return [this.firstName, this.lastName].filter(s => s).join(' ');
});

PersonSchema.pre('findOneAndUpdate', addHierarchyPath);
PersonSchema.pre('save', addHierarchyPath);

registerErrorHandlingHooks(PersonSchema);

export const PersonModel = mongoose.model<IPerson & mongoose.Document>('Person', PersonSchema);
