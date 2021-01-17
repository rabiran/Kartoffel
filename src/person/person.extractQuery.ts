import { config } from '../config/config';
import { extract, replaceValues, pickSingleValue } from '../utils';
import Query from '../types/Query';
import { PersonFilters, PersonSearchQuery } from './person.controller';

const { aliases: { persons: personAliases }, defaults: { persons: personDefaults } } = config.queries;

const extractFilterKeys: (keyof PersonFilters)[] = ['currentUnit', 'domainUsers.dataSource', 
  'entityType', 'job', 'rank', 'responsibility', 'serviceType', 'status', 'underGroupId'];
const extractSearchKeys: (keyof PersonSearchQuery)[] = [...extractFilterKeys, 'fullName'];


export const extractFilters = (query: Query<Partial<PersonFilters>>): Partial<PersonFilters> => {
  const { underGroupId, ...rest } = applyDefaultsAndAliases(extract(query, extractFilterKeys));
  return {
    ...!!underGroupId && {
      underGroupId: pickSingleValue(underGroupId),
    },
    ...rest,
  };
};

export const extractSearchQuery = (query: Query<Partial<PersonSearchQuery>>): Partial<PersonSearchQuery> => {
  const { fullName, ...filters } = extract(query, extractSearchKeys);
  const filtersWithAliases = extractFilters(filters);
  return {
    ...filtersWithAliases,
    fullName: pickSingleValue(fullName),
  };
};

const applyDefaultsAndAliases = (query: Query<Partial<PersonFilters>>): Query<Partial<PersonFilters>> => {
  const withDefaults = { ...personDefaults, ...query };
  return replaceValues(withDefaults, personAliases);
};
