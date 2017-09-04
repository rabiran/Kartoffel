import { Document } from 'mongoose';
import { IGroup } from '../group.interface';


export interface IKartoffel extends IGroup {
    ancestors: Array<string>;
    children: Array<IKartoffel | string>;
    hierarchy: Array<string>;
    type: string;
}

export const KARTOFFEL_BASIC_FIELDS = ['name', 'clearance', 'type'];