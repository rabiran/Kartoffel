import { RouteParamsValidate as RPV } from '../../helpers/route.validator';
import { ValidationError } from '../../types/error';

export const createAllowedFileds = ['name', 'parentId', 'akaUnit'];
export const updateAllowedFileds = ['akaUnit'];

export class OGRouteValidate {
  static adoption(parentId: any, childrenIds: any) {
    if (typeof parentId !== 'string') throw new ValidationError('The parentId need to be type of string');
    if (!Array.isArray(childrenIds)) throw new ValidationError('The childrenIds need to be array');
  }
  static creation = RPV.fieldExistanceGenerator(createAllowedFileds);
  static update = RPV.fieldExistanceGenerator(updateAllowedFileds);
}
