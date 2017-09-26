import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IGroup extends Document {
    name: string;
    admins: Array<IUser | string>;
    members: Array<string>;
    clearance: number;
    updatedAt: Date;
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