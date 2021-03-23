import { IOrganizationGroup } from './organizationGroup.interface';
import { GroupExcluderQuery } from './organizationGroup.excluder.query';

export type GroupQuery = {
  name: string,
  hierarchy: string;
};

export type GroupFilters = {
  underGroupId: string;
  isAlive: boolean;
};

export interface OrganizationGroupTextSearch {
  searchByNameAndHierarchy(nameAndHierarchyQuery: Partial<GroupQuery>, filters?: Partial<GroupFilters>, 
    excluderQuery?: Partial<GroupExcluderQuery>) : Promise<IOrganizationGroup[]>;
}
