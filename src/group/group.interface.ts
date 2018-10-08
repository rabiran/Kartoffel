import { Document } from 'mongoose';
import { IPerson } from '../person/person.interface';

export interface IGroup {
  id?: string;
  name: string;
  admins?: IPerson[] | string[];
  members?: IPerson[] | string[];
  updatedAt?: Date;
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
