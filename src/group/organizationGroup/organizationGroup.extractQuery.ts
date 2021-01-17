import { GroupQuery as GroupQueryDTO, GroupFilters } from './organizationGroup.controller';
import Query from '../../types/Query';
import { extract, isBooleanString, pickSingleValue } from '../../utils';
import { config } from '../../config/config';


type GroupSearchQuery = GroupQueryDTO & { nameAndHierarchy: string };

const { organizationGroups: defaults } = config.queries.defaults;

const extractFilterKeys: (keyof GroupFilters)[] = ['isAlive'];
const extractKeys: (keyof GroupSearchQuery)[] = ['hierarchy', 'name', 'nameAndHierarchy', 'isAlive'];


function extractFilters(query: Query<Partial<GroupFilters>>): Partial<GroupFilters> {
  const { isAlive } = applyDefultsAndAliases(extract(query, extractFilterKeys));
  return {
    ...!!isAlive && {
      isAlive: pickSingleValue(isAlive) === 'true',
    },
  };
}

export function extractSearchQuery(query: Query<Partial<GroupSearchQuery>>)
: Partial<GroupQueryDTO> {
  const { 
    nameAndHierarchy, 
    name: nameQuery, 
    hierarchy: hierarchyQuery,
  } = extract(query, extractKeys);
  const name = nameQuery || nameAndHierarchy;
  const hierarchy = hierarchyQuery || nameAndHierarchy;

  return {
    ...!!hierarchy && {
      hierarchy: pickSingleValue(hierarchy),
    },
    ...!!name && {
      name: pickSingleValue(name),
    },
    ...extractFilters(query),
  };  
}

function applyDefultsAndAliases(query: Query<Partial<GroupFilters>>): Query<Partial<GroupFilters>> {
  const keepDefaultIsAlive = !!query.isAlive && !isBooleanString(pickSingleValue(query.isAlive)) ? 
    { isAlive: defaults.isAlive } : {};
  return { ...defaults, ...query, ...keepDefaultIsAlive };
}
