import { IOrganizationGroup } from './organizationGroup.interface';

export type GroupQuery = {
  nameAndHierarchyTerms: string | string[];
};

export type GroupFilters = {
  hierarchyPath: string;
};

export interface OrganizationGroupTextSearch {
  searchByNameAndHierarchy(query: Partial<GroupQuery>, filters?: Partial<GroupFilters>)
    : Promise<IOrganizationGroup[]>;
}
