import { GroupFilters } from './organizationGroup.controller';
import Query from '../../types/Query';
import { extract, replaceValues } from '../../utils';
import singleValue from '../../helpers/makeSingleValue';


const filterKeys: (keyof GroupFilters)[] = ['hierarchyString'];

export function extractGroupFilters(query: Query<Partial<GroupFilters>>)
: Partial<GroupFilters> {
  const { hierarchyString } = extract(query, filterKeys);
  return {
    hierarchyString: singleValue(hierarchyString),
  };
}
