import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IGroup extends Document {
  name: string;
  admins: IUser[] | string[];
  members: IUser[] | string[];
  clearance: number;
  updatedAt: Date;
}

export interface IOrganizationGroup extends IGroup {
  ancestors: IOrganizationGroup[];
  children: IOrganizationGroup[];
  type: string;
}

export interface IApfel extends IGroup {
  isOpen: boolean;
  isVisible: boolean;
  tags: string[];
}
