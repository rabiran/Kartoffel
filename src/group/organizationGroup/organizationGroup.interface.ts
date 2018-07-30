import { Document } from 'mongoose';
import { IGroup } from '../group.interface';
import { IUser } from '../../user/user.interface';


export interface IOrganizationGroup extends IGroup {
  ancestors: string[];
  children: IOrganizationGroup[] | string[];
  directMembers: IUser[];
  directManagers: IUser[];
  hierarchy: string[];
  type: string;
  isALeaf: boolean;
}

export const ORGANIZATION_GROUP_BASIC_FIELDS = ['name', 'clearance', 'type', 'childless'];
export const ORGANIZATION_GROUP_OBJECT_FIELDS = ['ancestors', 'children', 'members', 'admins', 'directMembers', 'directManagers'];
export const ORGANIZATION_GROUP_KEYS = ['_id', 'updatedAt', 'name', 'clearance', 'type', 'hierarchy', 'ancestors', 'children', 'members', 'admins', 'directMembers', 'directManagers', 'childless'];
