import { Document } from 'mongoose';
import { IGroup } from '../group.interface';


export interface IKartoffel extends IGroup {
    ancestors: Array<IKartoffel | string>;
    children: Array<IKartoffel>;
    type: string;
}

export const KARTOFFEL_BASIC_FIELDS = ['name', 'clearance', 'type'];