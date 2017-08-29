import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IGroup extends Document {
    _id: string;
    name: string;
    admins: Array<IUser>;
    members: Array<IUser>;
    clearance: number;
}

export interface IKartoffel extends IGroup {
    ancestors: Array<IKartoffel>;
    children: Array<IKartoffel>;
    type: string;
}

export interface IApfel extends IGroup {
    isOpen: boolean;
    isVisible: boolean;
    tags: Array<string>;
}