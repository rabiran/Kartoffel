import { Document } from 'mongoose';
import { Rank } from '../utils';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';

export interface IUser extends Document {
// User's Basic information
  _id: string;
  firstName: string;
  lastName: string;
  directGroup: IKartoffel | string;
  managedGroup: IKartoffel | string;
  rank: Rank;
  alive: boolean;
// Weak groups props
  weakGroups: string[];
  adminGroups: string[];
// Editable by the User
  job: string;
  mail: string;
  phone: string;
  address: string;
// Editable with strong permissions
  isSecurityOfficer: boolean;
  securityOfficerLocation: string;
  clearance: number;
  updatedAt: Date;
}

export const PERSONAL_FIELDS = ['job', 'mail', 'phone', 'address'];
export const USER_FIELDS = PERSONAL_FIELDS.concat(
  ['firstName', 'lastName', 'directGroup', 'managedGroup', 'rank', 'isSecurityOfficer', 'securityOfficerLocation']);
