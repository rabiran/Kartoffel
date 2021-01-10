import { config } from '../config/config';
import { extract, replaceValues } from '../utils';
import Query from '../types/Query';
import { PersonFilter, PersonSearchQuery } from './person.controller';
import singleValue from '../helpers/makeSingleValue';

export const queryParamsRenameMap = {
  domainusers: 'domainUsers',
  'domainusers.datasource': 'domainUsers.dataSource',
  'domainusers.uniqeid': 'domainUsers.uniqueID',
  'domainusers.adfsuid': 'domainUsers.adfsUID',
  identitycard: 'identityCard',
  personalnumber: 'personalNumber',
  entitytype: 'entityType',
  servicetype: 'serviceType',
  firtsname: 'firstName',
  lastname: 'lastName',
  currentunit: 'currentUnit',
  dischargeday: 'dischargeDay',
  directgroup: 'directGroup',
  managedgroup: 'managedGroup',
  responsibilitylocation: 'responsibilityLocation',
  mobilephone: 'mobilePhone',
  fullname: 'fullName',
  rank: 'rank',
  status: 'status',
  responsibility: 'responsibility',
  job: 'job',
} as const;

const { aliases: { persons: personAliases }, defaults: { persons: personDefaults } } = config.queries;

const filterFields: (keyof PersonFilter)[] = ['currentUnit', 'domainUsers.dataSource', 
  'entityType', 'job', 'rank', 'responsibility', 'serviceType', 'status', 'hierarchyPath'];
const searchFields: (keyof PersonSearchQuery)[] = [...filterFields, 'fullName'];


export const extractFilterQuery = (query: Query<Partial<PersonFilter>>): Partial<PersonFilter> => {
  const { hierarchyPath, ...rest } = applyDefaultsAndAliases(extract(query, filterFields));
  return {
    ...!!hierarchyPath && {
      hierarchyPath: singleValue(hierarchyPath),
    },
    ...rest,
  };
};

export const extractSearchQuery = (query: Query<Partial<PersonSearchQuery>>): Partial<PersonSearchQuery> => {
  const { fullName, ...filters } = extract(query, searchFields);
  const filtersWithAliases = extractFilterQuery(filters);
  return {
    ...filtersWithAliases,
    fullName: singleValue(fullName),
  };
};

const applyDefaultsAndAliases = (query: Query<Partial<PersonFilter>>): Query<Partial<PersonFilter>> => {
  const withDefaults = { ...personDefaults, ...query } as Query<Partial<PersonFilter>>;
  return replaceValues(withDefaults, personAliases);
};
