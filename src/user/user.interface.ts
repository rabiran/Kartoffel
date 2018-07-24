import { Document } from 'mongoose';
import { Rank, Responsibility } from '../utils';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';
import { ObjectId } from 'bson';

export interface IUser extends Document {
// User's Basic information
  _id: string;
  identityCard: string;
  personalNumber: string;
  primaryUser: string;
  secondaryUsers: string[];
  serviceType: string;
  firstName: string;
  lastName: string;
  currentUnit: string;
  alive: boolean;
  dischargeDay: Date;
  hierarchy: string[];
  directGroup: IKartoffel | string;
  managedGroup: IKartoffel | string;
  rank: Rank;
  updatedAt: Date;
  createdAt: Date;
// Weak groups props
  // weakGroups: string[];
  // adminGroups: string[];
// Editable by the User
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
export const USER_FIELDS = PERSONAL_FIELDS.concat(
  ['primaryUser', 'secondaryUsers', 'serviceType', 'firstName', 'lastName', 'currentUnit', 
    'dischargeDay', 'hierarchy', 'directGroup', 'managedGroup', 'rank', 'alive', 'responsibility', 'responsibilityLocation', 'clearance']);
