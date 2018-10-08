import { Document } from 'mongoose';
import { IPerson } from '../person/person.interface';

export interface IGroup {
  id?: string;
  name: string;
  directManagers?: IPerson[] | string[];
  directMembers?: IPerson[] | string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface IApfel extends IGroup {
  isOpen: boolean;
  isVisible: boolean;
  tags: string[];
}
