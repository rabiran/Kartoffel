import * as mongoose from 'mongoose';
import { IUser } from './user.interface';
import { UserValidate } from './user.validate';

(<any>mongoose).Promise = Promise;
const ObjectId = mongoose.Types.ObjectId;

const userValidator = new UserValidate();

function validateEmail(email: string): boolean {
    return true;
}

export const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
        validate: { validator: UserValidate.id, msg: '{VALUE} is an invalid ID' }
    },
    firstName: {
        type: String,
        required: true,
        validate: { validator: UserValidate.namePart, msg: 'Invalid First Name' }
    },
    lastName: {
        type: String,
        required: true,
        validate: { validator: UserValidate.namePart, msg: '{VALUE} is an invalid Last Name' }
    },
    directGroup: {
        type: String,
        required: false,
        default: undefined
    },
    job: String,

    weakGroups: {
        type: [String],
        default: []
    },
    adminGroups: {
        type: [String],
        default: []
    },

    mail: {
        type: String,
        validate: { validator: UserValidate.email, message: '{VALUE} is not a valid email adress!'}
    },
    phone: String,
    rank: {
        type: String,
        default: 'Newbie',

        validate: { validator: UserValidate.rank, message: '{VALUE} is an invalid rank!'}
    },
    address: String,

    isSecurityOfficer: {
        type: Boolean,
        default: false
    },
    securityOfficerLocation: String,
    clearance: {
        type: Number,
        default: 0
    },
    alive: {
        type: Boolean,
        default: true
    },
    updatedAt: Date,
});

UserSchema.methods.fullName = () => {
    return (this.firstName.trim() + ' ' + this.lastName.trim());
};

UserSchema.pre('save', function (next) {
    if (!this.updatedAt) this.updatedAt = new Date;
    next();
  });

UserSchema.pre('update', function() {
    this.update({}, { $set: { updatedAt: new Date() } });
  });

export const UserModel = mongoose.model<IUser>('User', UserSchema);