import { RouteParamsValidate as RPV } from '../../helpers/route.validator';

export const createAllowedFileds = ['name', 'parentId'];

export class OGRouteValidate {
  static adoption(parentId: any, childrenIds: any) {
    if (typeof parentId !== 'string') throw new Error('The parentId need to be type of string');
    if (!Array.isArray(childrenIds)) throw new Error('The childrenIds need to be array');
  }
  static creation = RPV.fieldExistanceGenerator(createAllowedFileds);
}
