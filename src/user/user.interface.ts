import { Document } from 'mongoose';
import { Rank } from '../utils';

export interface IUser extends Document {
    _id: string;
    firstName: string;
    lastName: string;
    hierarchy: string[];
    directGroup: string;
    job: string;

    weakGroups: string[];
    adminGroups: string[];

    mail: string;
    phone: string;
    rank: Rank;
    address: string;

    isSecurityOfficer: boolean;
    securityOfficerLocation: string;
    clearance: number;
}