import { IOrganizationGroup } from './organizationGroup.interface'

type GroupQuery = {
  name: string;
  hierarchy: string[];
}

export interface OrganizationGroupTextSearch {
  searchByName(query: Partial<GroupQuery>): Promise<IOrganizationGroup[]>
}
