import { GroupQuery as GroupQueryDTO, GroupFilters } from './organizationGroup.controller';
import Query from '../../types/Query';
import { extract, isBooleanString, pickSingleValue, replaceValues } from '../../utils';
import { config } from '../../config/config';


type GroupSearchQuery = GroupQueryDTO & { nameAndHierarchy: string };

const { defaults: { organizationGroups: defaults }, aliases: { organizationGroups: aliases } } = config.queries;

const extractFilterKeys: (keyof GroupFilters)[] = ['isAlive'];
const extractKeys: (keyof GroupSearchQuery)[] = ['hierarchy', 'name', 'nameAndHierarchy'];


function extractFilters(query: Query<Partial<GroupFilters>>): Partial<GroupFilters> {
  const { isAlive } = applyDefultsAndAliases(extract(query, extractFilterKeys));
  return {
    ...!!isAlive && {
      isAlive: pickSingleValue(isAlive).toLowerCase() === 'true',
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
  const overrideIsAlive = 
    !!query.isAlive && 
    !isBooleanString(pickSingleValue(query.isAlive)) && 
    !(query.isAlive in aliases.isAlive) ? 
      { isAlive: defaults.isAlive } : {};
  const withDefaults = { ...defaults, ...query, ...overrideIsAlive };
  return replaceValues(withDefaults, aliases);
}
