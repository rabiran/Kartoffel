import { Document } from 'mongoose';
import { Rank, Responsibility } from '../utils';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { ObjectId } from 'bson';

export interface IPerson extends Document {
// Person's Basic information
  _id: ObjectId;
  identityCard: string;
  personalNumber: string;
  primaryPerson: string;
  secondaryPersons: string[];
  serviceType: string;
  firstName: string;
  lastName: string;
  currentUnit: string;
  alive: boolean;
  dischargeDay: Date;
  hierarchy: string[];
  directGroup: IOrganizationGroup | ObjectId;
  managedGroup: IOrganizationGroup | ObjectId;
  rank: Rank;
  updatedAt: Date;
  createdAt: Date;
// Editable by the Person
  job: string;
  mail: string;
  phone: string[];
  mobilePhone: string[];
  address: string;
// Editable with strong permissions
  responsibility: Responsibility;
  responsibilityLocation: ObjectId;
  clearance: string;
}

export const PERSONAL_FIELDS = ['job', 'mail', 'phone', 'address', 'mobilePhone'];
export const PERSON_FIELDS = PERSONAL_FIELDS.concat(
  ['primaryPerson', 'secondaryPersons', 'serviceType', 'firstName', 'lastName', 'currentUnit', 
    'dischargeDay', 'hierarchy', 'directGroup', 'managedGroup', 'rank', 'alive', 'responsibility', 'responsibilityLocation', 'clearance']);
