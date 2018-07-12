import * as mongoose from 'mongoose';
import { IUser } from './user.interface';
import { UserValidate } from './user.validate';

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
      required: [true, "You must enter an identity card!"],
      index: true,
      unique: true,
      validate: { validator: UserValidate.identityCard, message: '{VALUE} is an invalid identity card!' }
    },    
    personalNumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: { validator: UserValidate.personalNumber, message: '{VALUE} is an invalid personal number!' }
    },
    primaryUser: {
      type: String,
      required: true,
      unique: true,
      validate: { validator: UserValidate.email, message: '{VALUE} is an invalid User' }
    },
    secondaryUser: [{
      type: String,   
      validate: { validator: UserValidate.email, message: '{VALUE} is an invalid User' }
    }],
    serviceType: String,
    firstName: {
      type: String,
      required: true,
      validate: { validator: UserValidate.namePart, message: '{VALUE} is an invalid First Name' }
    },
    lastName: {
      type: String,
      required: true,
      validate: { validator: UserValidate.namePart, message: '{VALUE} is an invalid Last Name' }
    },
    currentUnit: String,
    dischargeDay: {
      type: Date,
      required: true
    },
    hierarchy: [{
      type: String,
      required: true
    }],           
    job: {
      type: String,
      required: true
    },
    directGroup: {
      type: ObjectId,
      index: true
    },
    managedGroup: {
      type: ObjectId,
      index: true
    },
    responsibility: {
      type: String,
      default: 'None',
      validate: { validator: UserValidate.responsibility, message: '{VALUE} is an invalid responsibility!'}
    },
    responsibilityLocation: {
      type: ObjectId,
      required: () =>{this.responsibility !== 'None'}
    },
        
    mail: {
      type: String,
      validate: { validator: UserValidate.email, message: '{VALUE} is not a valid email address!' }
    },
    phone: [{
      type: String,
      validate: { validator: UserValidate.phone, message: '{VALUE} is not a valid phone number!' }
    }],
      
    mobilePhone: [{
      type: String,
      validate: {validator: UserValidate.mobilePhone, message: '{VALUE} is not a valid mobile phone number!'}
    }],
    rank: {
      type: String,
      default: 'Newbie',
      validate: { validator: UserValidate.rank, message: '{VALUE} is an invalid rank!' }
    },
    address: String,    
    
    clearance: {
      type: Number,
      default: 0,
      validate: {validator: UserValidate.clearance, message: '{VALUE} is an invalid clearance!'}
    },
    alive: {
      type: Boolean,
      default: true
    }
    // weakGroups: {
    //   type: [String],
    //   default: [],
    // },
    // adminGroups: {
    //   type: [String],
    //   default: [],
    // },

  },
  {
    toJSON: {
      virtuals: true,
      versionKey:false,
    }
  },
  { 
    timestamps: true
  }
);

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
