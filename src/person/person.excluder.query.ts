import { IPerson } from './person.interface';

export type PersonExcluderQuery = {
  hierarchy: string[]; // array of hierarchy strings. e.g: ['a/b/c', 'a/g']
  rank: string[];
  currentUnit: string[];
};

export function statisfyExcluder(person: IPerson, excluder: Partial<PersonExcluderQuery>) {
  const { hierarchy = [], ...rest } = excluder;
  for (const key of Object.keys(rest)) {
    const excluded: string[] = rest[key];
    if (excluded.includes(person[key])) {
      return true;
    }
  }
  const hierarchyPath = person.hierarchy.join('/');
  for (const h of hierarchy) {
    if (hierarchyPath.startsWith(h)) {
      return true;
    }
  }
  return false;
}

export default PersonExcluderQuery;
