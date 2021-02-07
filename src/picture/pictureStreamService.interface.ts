// import { IPerson } from './person.interface';

import { Readable } from "stream";

// export type PersonFilters = Partial<{
//   status: string | string[];
//   entityType: string | string[];
//   'domainUsers.dataSource': string | string[];
//   rank: string | string[];
//   responsibility: string | string[];
//   hierarchyPath: string;
// }>;

export interface PictureStreamService {
  getPicture(path: string) : Promise<Readable>;
}
