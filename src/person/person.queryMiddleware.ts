import { KeyMap } from '../utils';
import { STATUS as allStatuses, DATA_SOURCE } from '../config/db-enums';

export const queryParamsRenameMap: KeyMap = {
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
};

export const queryDefaults = {
  status: 'active',
  // entityType: [],
  'domainUsers.dataSource': 'daaa',
};

export const queryAllowedFields = ['currentUnit', 'domainUsers', 'domainUsers.dataSource', 'entityType', 
  'firstName','job', 'lastName', 'rank', 'responsibility', 'serviceType', 'status'];

export const serachAllowedFields = queryAllowedFields.concat(['fullName']); 

const queryValuesAliases = {
  status: {
    all: allStatuses,
  },
  'domainUsers.dataSource': {
    nonExternals: DATA_SOURCE.slice(0, DATA_SOURCE.length - 1),
  },
};
