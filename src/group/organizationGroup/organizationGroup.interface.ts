import { IGroup } from '../group.interface';
import { IPerson } from '../../person/person.interface';
import { ObjectId } from 'bson';


export interface IOrganizationGroup extends IGroup {
  ancestors?: string[];
  children?: IOrganizationGroup[] | string[];
  hierarchy?: string[];
  isALeaf?: boolean;
  isAlive?: boolean;
}

export const ORGANIZATION_GROUP_BASIC_FIELDS = ['name', 'clearance', 'type', 'isALeaf'];
export const ORGANIZATION_GROUP_OBJECT_FIELDS = ['ancestors', 'children','directMembers', 'directManagers'];
export const ORGANIZATION_GROUP_KEYS = ['id', 'updatedAt', 'name', 'clearance', 'type', 'hierarchy', 'ancestors', 'children', 'directMembers', 'directManagers', 'isALeaf'];
