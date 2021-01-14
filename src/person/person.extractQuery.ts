import { config } from '../config/config';
import { extract, replaceValues } from '../utils';
import Query from '../types/Query';
import { PersonFilter, PersonSearchQuery } from './person.controller';
import singleValue from '../helpers/makeSingleValue';

const { aliases: { persons: personAliases }, defaults: { persons: personDefaults } } = config.queries;

const extractFilterKeys: (keyof PersonFilter)[] = ['currentUnit', 'domainUsers.dataSource', 
  'entityType', 'job', 'rank', 'responsibility', 'serviceType', 'status', 'underGroupId'];
const extractSearchKeys: (keyof PersonSearchQuery)[] = [...extractFilterKeys, 'fullName'];


export const extractFilters = (query: Query<Partial<PersonFilter>>): Partial<PersonFilter> => {
  const { underGroupId, ...rest } = applyDefaultsAndAliases(extract(query, extractFilterKeys));
  return {
    ...!!underGroupId && {
      hierarchyPath: singleValue(underGroupId),
    },
    ...rest,
  };
};

export const extractSearchQuery = (query: Query<Partial<PersonSearchQuery>>): Partial<PersonSearchQuery> => {
  const { fullName, ...filters } = extract(query, extractSearchKeys);
  const filtersWithAliases = extractFilters(filters);
  return {
    ...filtersWithAliases,
    fullName: singleValue(fullName),
  };
};

const applyDefaultsAndAliases = (query: Query<Partial<PersonFilter>>): Query<Partial<PersonFilter>> => {
  const withDefaults = { ...personDefaults, ...query };
  return replaceValues(withDefaults, personAliases);
};
