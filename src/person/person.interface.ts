import { Document } from 'mongoose';
import { Rank, Responsibility } from '../utils';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { IDomainUser } from '../domainUser/domainUser.interface';

export interface IPerson {
// Person's Basic information
  id?: string;
  identityCard: string;
  personalNumber?: string;
  primaryDomainUser?: string | IDomainUser;
  secondaryDomainUsers?: string[] | IDomainUser[];
  serviceType: string;
  firstName: string;
  lastName: string;
  currentUnit?: string;
  alive?: boolean;
  dischargeDay: Date;
  hierarchy: string[];
  directGroup: string | IOrganizationGroup; 
  managedGroup?: string | IOrganizationGroup;
  rank?: Rank;  // optional at create
  updatedAt?: Date;
  createdAt?: Date;
// Editable by the Person
  job: string;
  mail?: string;
  phone?: string[];
  mobilePhone?: string[];
  address?: string;
// Editable with strong permissions
  responsibility?: Responsibility;
  responsibilityLocation?: string | IOrganizationGroup;
  clearance?: string;
}

export const EDITABLE_FIELDS = ['job', 'mail', 'phone', 'address', 'mobilePhone'];
export const PERSON_FIELDS = EDITABLE_FIELDS.concat(
  ['primaryDomainUser', 'secondaryDomainUsers', 'serviceType', 'firstName', 'lastName', 'currentUnit', 
    'dischargeDay', 'hierarchy', 'directGroup', 'managedGroup', 'rank', 'alive', 'responsibility', 'responsibilityLocation', 'clearance']);
