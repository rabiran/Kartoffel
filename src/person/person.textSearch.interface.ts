import { IPerson } from './person.interface';

export type PersonFilters = Partial<{
  status: string | string[];
  entityType: string | string[];
  'domainUsers.dataSource': string | string[];
  rank: string | string[];
  responsibility: string | string[];
  hierarchyPath: string;
}>;

export interface PersonTextSearch {
  searchByFullName(fullName: string, filters?: Partial<PersonFilters>): Promise<IPerson[]>;
}
