import { Document } from 'mongoose';
import { IGroup } from '../group.interface';


export interface IKartoffel extends IGroup {
  ancestors: string[];
  children: IKartoffel[] | string[];
  hierarchy: string[];
  type: string;
  isALeaf: boolean;
}

export const KARTOFFEL_BASIC_FIELDS = ['name', 'clearance', 'type', 'childless'];
export const KARTOFFEL_OBJECT_FIELDS = ['ancestors', 'children', 'members', 'admins', 'directMembers'];
export const KARTOFFEL_KEYS = ['_id', 'updatedAt', 'name', 'clearance', 'type', 'hierarchy', 'ancestors', 'children', 'members', 'admins', 'directMembers', 'childless'];
