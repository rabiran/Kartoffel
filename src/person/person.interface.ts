import { Types } from 'mongoose';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';

export interface IPerson {
// Person's Basic information
  id?: string;
  identityCard: string;
  personalNumber?: string;
  domainUsers?: IDomainUser[] | string[];
  entityType: string;
  serviceType?: string;
  firstName: string;
  lastName: string;
  currentUnit?: string;
  alive?: boolean;
  dischargeDay?: Date;
  hierarchy?: string[];
  directGroup: string | Types.ObjectId | IOrganizationGroup; 
  managedGroup?: string | Types.ObjectId | IOrganizationGroup;
  rank?: string;
  updatedAt?: Date;
  createdAt?: Date;
// Editable by the Person
  job: string;
  mail?: string;
  phone?: string[];
  mobilePhone?: string[];
  address?: string;
// Editable with strong permissions
  responsibility?: string;
  responsibilityLocation?: string | Types.ObjectId | IOrganizationGroup;
  clearance?: string;
}

export interface IDomainUser {
  id?: string;
  domain: string;
  name: string;
  dataSource: string;
  uniqueID?: string;
  adfsUID?: string;
}
