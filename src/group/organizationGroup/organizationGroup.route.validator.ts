import { RouteParamsValidate as RPV } from '../../helpers/route.validator';
import { ValidationError } from '../../types/error';

export const createAllowedFileds = ['name', 'parentId', 'akaUnit'];
export const updateAllowedFileds = ['akaUnit'];

const CHILDREN_MAX_DEPTH = 10;

const maxDepthRange = RPV.inRangeGenerator(0, CHILDREN_MAX_DEPTH);

export class OGRouteValidate {
  static adoption(parentId: any, childrenIds: any) {
    if (typeof parentId !== 'string') throw new ValidationError('The parentId need to be type of string');
    if (!Array.isArray(childrenIds)) throw new ValidationError('The childrenIds need to be array');
  }
  /**
   * validates the maxDepth parameter, throws error if invalid
   * @param val maxDepth parameter value
   */
  static maxDepth(val: any) {
    if (!val) return;
    if (!RPV.isInt(val) || !maxDepthRange(val)) {
      throw new ValidationError(`maxDepth must be positive integer in range: 0 - ${CHILDREN_MAX_DEPTH}`);
    }
  }

  static creation = RPV.fieldExistanceGenerator(createAllowedFileds);
  static update = RPV.fieldExistanceGenerator(updateAllowedFileds);
}
