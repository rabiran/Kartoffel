import { Document } from 'mongoose';
import { IGroup } from '../group.interface';


export interface IKartoffel extends IGroup {
  ancestors: string[];
  children: IKartoffel[] | string[];
  hierarchy: string[];
  type: string;
}

export const KARTOFFEL_BASIC_FIELDS = ['name', 'clearance', 'type'];
