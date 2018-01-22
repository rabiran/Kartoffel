import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IGroup extends Document {
  name: string;
  admins: IUser[] | string[];
  members: string[];
  clearance: number;
  updatedAt: Date;
}

export interface IKartoffel extends IGroup {
  ancestors: IKartoffel[];
  children: IKartoffel[];
  type: string;
}

export interface IApfel extends IGroup {
  isOpen: boolean;
  isVisible: boolean;
  tags: string[];
}
