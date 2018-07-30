import * as mongoose from 'mongoose';
import { IUser } from './user.interface';
import { UserValidate } from './user.validate';
import { RESPONSIBILITY } from '../utils';

(<any>mongoose).Promise = Promise;
const ObjectId = mongoose.Schema.Types.ObjectId;

const userValidator = new UserValidate();

function validateEmail(email: string): boolean {
  return true;
}

export const UserSchema = new mongoose.Schema(
  {
    identityCard: {
      type: String,
      required: [true, 'You must enter an identity card!'],
      unique: true,
      validate: { validator: UserValidate.identityCard, message: '{VALUE} is an invalid identity card!' },
    },
    personalNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: { validator: UserValidate.personalNumber, message: '{VALUE} is an invalid personal number!' },
    },
    primaryUser: {
      type: String,
      required: [true, 'You must enter a primary user!'],
      unique: true,
      validate: { validator: UserValidate.email, message: '{VALUE} is an invalid User' },
    },
    secondaryUsers: [{
      type: String,
      validate: { validator: UserValidate.email, message: '{VALUE} is an invalid User' },
    }],
    serviceType: String,
    firstName: {
      type: String,
      required: [true, 'You must enter a first name!'],
      validate: { validator: UserValidate.namePart, message: '{VALUE} is an invalid First Name' },
    },
    lastName: {
      type: String,
      required: [true, 'You must enter a last name!'],
      validate: { validator: UserValidate.namePart, message: '{VALUE} is an invalid Last Name' },
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
      validate: { validator: UserValidate.job, message: '{VALUE} is an invalid job' },
    },
    directGroup: {
      type: ObjectId,
      index: true,
    },
    managedGroup: {
      type: ObjectId,
      index: true,
    },
    responsibility: {
      type: String,
      default: 'None',
      validate: { validator: UserValidate.responsibility, message: '{VALUE} is an invalid responsibility!' },
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
          return UserValidate.responsibilityLocation(v, res);
        },
        message: '{VALUE} is not consumed or invalid responsibility location',
      },
    },

    mail: {
      type: String,
      validate: { validator: UserValidate.email, message: '{VALUE} is not a valid email address!' },
    },
    phone: [{
      type: String,
      validate: { validator: UserValidate.phone, message: '{VALUE} is not a valid phone number!' },
    }],

    mobilePhone: [{
      type: String,
      validate: { validator: UserValidate.mobilePhone, message: '{VALUE} is not a valid mobile phone number!' },
    }],
    rank: {
      type: String,
      default: 'Newbie',
      validate: { validator: UserValidate.rank, message: '"{VALUE}" is an invalid rank!' },
    },
    address: String,

    clearance: {
      type: String,
      default: '0',
      validate: { validator: UserValidate.clearance, message: '{VALUE} is an invalid clearance!' },
    },

    // weakGroups: {
    //   type: [String],
    //   default: [],
    // },
    // adminGroups: {
    //   type: [String],
    //   default: [],
    // },

  }
);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

UserSchema.set('timestamps', true);

UserSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

// UserSchema.virtual('id').get(function () {
//   return this._id;
// });

/* UserSchema.pre('save', function (next) {
  if (!this.updatedAt) this.updatedAt = new Date();
  if (!this.createdAt) this.createdAt = new Date();
  next();
});

UserSchema.pre('update', function () {
  this.update({}, { $set: { updatedAt: new Date() } });
}); */

export const UserModel = mongoose.model<IUser>('User', UserSchema);
