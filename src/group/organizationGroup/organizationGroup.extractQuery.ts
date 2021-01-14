import { GroupQuery as GroupQueryDTO } from './organizationGroup.controller';
import Query from '../../types/Query';
import { extract, replaceValues } from '../../utils';
import makeSingleValue from '../../helpers/makeSingleValue';

type SearchGroupQuery = GroupQueryDTO & { nameAndHierarchy: string };


const extractKeys: (keyof SearchGroupQuery)[] = ['hierarchy', 'name', 'nameAndHierarchy'];

export function extractGroupQuery(query: Query<Partial<SearchGroupQuery>>)
: Partial<GroupQueryDTO> {
  const { nameAndHierarchy, name: nameQuery, hierarchy: hierarchyQuery } = extract(query, extractKeys);
  const name = nameQuery || nameAndHierarchy;
  const hierarchy = hierarchyQuery || nameAndHierarchy;

  return {
    ...!!hierarchy && {
      hierarchy: makeSingleValue(hierarchy),
    },
    ...!!name && {
      name: makeSingleValue(name),
    },
  };  
}
