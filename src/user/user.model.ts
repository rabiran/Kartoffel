import * as mongoose from 'mongoose';
import { IUser } from './user.interface';

(<any>mongoose).Promise = Promise;

export const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    hierarchy: {
        type: Array,
        required: true
    },
    directGroup: {
        type: Array,
        required: true
    },
    job: String,

    weakGroups: Array,
    adminGroups: Array,

    mail: String,
    phone: String,
    rank: String,
    address: String,

    isSecurityOfficer: Boolean,
    securityOfficerLocation: String,
    clearance: Number
});

UserSchema.methods.fullName = () => {
    return (this.firstName.trim() + ' ' + this.lastName.trim());
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);