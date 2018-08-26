import * as mongoose from 'mongoose';
import { IPerson } from './person.interface';
import { PersonValidate } from './person.validate';
import { RESPONSIBILITY } from '../utils';

(<any>mongoose).Promise = Promise;
const ObjectId = mongoose.Schema.Types.ObjectId;

const personValidator = new PersonValidate();

function validateEmail(email: string): boolean {
  return true;
}

export const PersonSchema = new mongoose.Schema(
  {
    identityCard: {
      type: String,
      required: [true, 'You must enter an identity card!'],
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
    secondaryDomainUsers: {
      type: [ObjectId],
      ref: 'DomainUser',
    },
    serviceType: {
      type: String,
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
      // required: [function () {
      //   const isUpdate = typeof this.getUpdate() === 'function';
      //   // allows to unset directGroup only if the person 'alive' is set to false at the SAME update!!
      //   const alive = isUpdate ? this.getUpdate().$set.alive : this.alive;
      //   return alive !== false;
      // }, 'a person must belong to an organization group'],
      index: true,
    },
    managedGroup: {
      type: ObjectId,
      index: true,
    },
    responsibility: {
      type: String,
      default: 'None',
      validate: { validator: PersonValidate.responsibility, message: '{VALUE} is an invalid responsibility!' },
    },
    responsibilityLocation: {
      type: ObjectId,
      required: [function () {
        // In update the mongo does not keep the document in "this" 
        const res = typeof this.getUpdate !== 'function' ? this.responsibility : this.getUpdate().$set.responsibility;        
        return res && res !== RESPONSIBILITY[0];
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
      default: 'Newbie',
      validate: { validator: PersonValidate.rank, message: '"{VALUE}" is an invalid rank!' },
    },
    address: String,

    clearance: {
      type: String,
      default: '0',
      validate: { validator: PersonValidate.clearance, message: '{VALUE} is an invalid clearance!' },
    },
  }
);

PersonSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

PersonSchema.set('timestamps', true);

PersonSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

export const PersonModel = mongoose.model<IPerson & mongoose.Document>('Person', PersonSchema);
