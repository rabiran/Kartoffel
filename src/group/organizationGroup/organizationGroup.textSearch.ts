import { IOrganizationGroup } from './organizationGroup.interface';

export type GroupQuery = {
  name: string,
  hierarchy: string;
};

export type GroupFilters = {
  underGroupId: string;
};

export interface OrganizationGroupTextSearch {
  searchByNameAndHierarchy(nameAndHierarchyQuery: Partial<GroupQuery>, filters?: Partial<GroupFilters>)
    : Promise<IOrganizationGroup[]>;
}
