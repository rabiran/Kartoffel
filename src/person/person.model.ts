import * as mongoose from 'mongoose';
import { IPerson } from './person.interface';
import { PersonValidate } from './person.validate';
import  * as consts  from '../config/db-enums';


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
};

function autoPopulate(next: Function) {
  this.populate('primaryDomainUser secondaryDomainUsers');
  next();
}

export const PersonSchema = new mongoose.Schema(
  {
    identityCard: {
      type: String,
      unique: true,
      validate: { validator: PersonValidate.identityCard, message: '{VALUE} is an invalid identity card!' },
    },
    personalNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: { validator: PersonValidate.personalNumber, message: '{VALUE} is an invalid personal number!' },
    },
    primaryDomainUser: {
      type: ObjectId,
      ref: 'DomainUser',
    },
    secondaryDomainUsers: [{
      type: ObjectId,
      ref: 'DomainUser',
    }],
    serviceType: {
      type: String,
      enum: consts.SERVICE_TYPE,
      required: [true, 'You must enter service type'],
    },
    firstName: {
      type: String,
      required: [true, 'You must enter a first name!'],
      validate: { validator: PersonValidate.namePart, message: '{VALUE} is an invalid First Name' },
    },
    lastName: {
      type: String,
      required: [true, 'You must enter a last name!'],
      validate: { validator: PersonValidate.namePart, message: '{VALUE} is an invalid Last Name' },
    },
    currentUnit: String,
    alive: {
      type: Boolean,
      default: true,
    },
    dischargeDay: {
      type: Date,
      required: [true, 'You must enter a discharge day!'],
    },
    hierarchy: {
      type: [String],
      required: [function () { return this.alive === true; }, 'You must enter a hierarchy!'],
      default: undefined,
    },
    job: {
      type: String,
      required: [function () {
        return this.alive === true;
      }, 'You must enter a job!'],
      validate: { validator: PersonValidate.job, message: '{VALUE} is an invalid job' },
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
      required: [function () {
        // In update the mongo does not keep the document in "this" 
        const res = typeof this.getUpdate !== 'function' ? this.responsibility : this.getUpdate().$set.responsibility;        
        return res && res !== consts.RESPONSIBILITY[0];
      },
        'You must enter a responsibility location!'],
      validate: {
        validator(v: string) {
          // In update the mongo does not keep the document in "this"
          const res = typeof this.getUpdate !== 'function' ? this.responsibility : this.getUpdate().$set.responsibility;        
          return PersonValidate.responsibilityLocation(v, res);
        },
        message: '{VALUE} is not consumed or invalid responsibility location',
      },
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
      enum: consts.RANK,
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

PersonSchema.pre('findOne', autoPopulate);

export const PersonModel = mongoose.model<IPerson & mongoose.Document>('Person', PersonSchema);
