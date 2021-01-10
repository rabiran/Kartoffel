import { GroupFilters } from './organizationGroup.controller';
import Query from '../../types/Query';
import { extract, replaceValues } from '../../utils';
import singleValue from '../../helpers/makeSingleValue';


const filterKeys: (keyof GroupFilters)[] = ['hierarchyPath'];

export function extractGroupFilters(query: Query<Partial<GroupFilters>>)
: Partial<GroupFilters> {
  const { hierarchyPath } = extract(query, filterKeys);
  return {
    ...!!hierarchyPath && { hierarchyPath: singleValue(hierarchyPath) },
  };
}
