import { Types } from 'mongoose';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';

export interface IPerson {
// Person's Basic information
  id?: string;
  identityCard: string;
  personalNumber?: string;
  domainUsers?: Partial<IDomainUser>[];
  entityType: string;
  serviceType?: string;
  firstName: string;
  lastName: string;
  currentUnit?: string;
  status?: string;
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

export interface IDomainUserIdentifier {
  name: string;
  domain: string;
}

export interface IDomainUser extends IDomainUserIdentifier{
  id?: string;
  dataSource: string;
  uniqueID?: string;
  adfsUID?: string;
}
