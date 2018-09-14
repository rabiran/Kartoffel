import { Document } from 'mongoose';
import { IPerson } from '../person/person.interface';

export interface IGroup extends Document {
  name: string;
  directManagers: IPerson[] | string[];
  directMembers: IPerson[] | string[];
  clearance: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface IApfel extends IGroup {
  isOpen: boolean;
  isVisible: boolean;
  tags: string[];
}
