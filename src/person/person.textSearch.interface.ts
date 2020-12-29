import { IPerson } from './person.interface';

export type PersonSearchQuery = Partial<{
  status: string | string[];
  entityType: string | string[];
  'domainUsers.dataSource': string | string[];
  rank: string | string[];
  responsibility: string | string[];
  fullName: string;
}>;

export interface PersonTextSearch {
  searchByQuery(query: PersonSearchQuery): Promise<IPerson[]>;
}
