import { IGroup } from '../group.interface';
import { IPerson } from '../../person/person.interface';


export interface IOrganizationGroup extends IGroup {
  ancestors?: string[];
  children?: IOrganizationGroup[] | string[];
  directMembers?: IPerson[];
  directManagers?: IPerson[];
  hierarchy?: string[];
  type?: string;
  isALeaf?: boolean;
}

export const ORGANIZATION_GROUP_BASIC_FIELDS = ['name', 'clearance', 'type', 'childless'];
export const ORGANIZATION_GROUP_OBJECT_FIELDS = ['ancestors', 'children', 'members', 'admins', 'directMembers', 'directManagers'];
export const ORGANIZATION_GROUP_KEYS = ['id', 'updatedAt', 'name', 'clearance', 'type', 'hierarchy', 'ancestors', 'children', 'members', 'admins', 'directMembers', 'directManagers', 'childless'];
