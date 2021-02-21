import { Types } from 'mongoose';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import Omit from '../types/Omit';

export type PictureType = 'profile';

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
  pictures?: {
    profile?: ProfilePictureDTO | SetProfilePictureDTO
  };
  sex?: string;
  birthDate?: Date;
}

export interface IDomainUserIdentifier {
  name: string;
  domain: string;
}

export interface IDomainUser extends IDomainUserIdentifier{
  id?: string;
  dataSource: string;
  mail?: string;
  hierarchy?: string[];
  uniqueID?: string;
  adfsUID?: string;
}

export interface PictureMeta {
  format?: string;
  updatedAt?: Date;
}

export interface ProfilePictureMeta extends PictureMeta {
  takenAt: Date;
}

export type ProfilePictureDTO = {
  url: string;
  meta: ProfilePictureMeta
};

export type SetProfilePictureDTO = Omit<ProfilePictureMeta, 'updatedAt'> & {
  path: string;
};

