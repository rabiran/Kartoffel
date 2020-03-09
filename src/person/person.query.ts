import { KeyMap } from '../utils';

export const fieldsCaseMap: KeyMap = {
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

export const fieldsDefaults = {
  status: 'active',
  'domainUsers.dataSource': 'daaa',
};
