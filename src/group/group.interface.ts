import { Document } from 'mongoose';
import { IPerson } from '../person/person.interface';

export interface IGroup extends Document {
  name: string;
  admins: IPerson[] | string[];
  members: IPerson[] | string[];
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
