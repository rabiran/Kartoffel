import { RouteParamsValidate as RPV } from '../../helpers/route.validator';
import { ValidationError } from '../../types/error';
import { ERS } from '../../config/config';
export const createAllowedFileds = ['name', 'parentId', 'akaUnit'];
export const updateAllowedFileds = ['akaUnit'];

const CHILDREN_MAX_DEPTH = 10;

const maxDepthRange = RPV.inRangeGenerator(1, CHILDREN_MAX_DEPTH);

export class OGRouteValidate {
  static adoption(parentId: any, childrenIds: any) {
    if (typeof parentId !== 'string') throw new ValidationError.TypeError('parentId', 'string');
    if (!Array.isArray(childrenIds)) throw new ValidationError.TypeError('childrenIds', 'array');
  }
  /**
   * validates the maxDepth parameter, throws error if invalid
   * @param val maxDepth parameter value
   */
  static maxDepth(val: any) {
    if (!val) return;
    if (!RPV.isInt(val) || !maxDepthRange(val)) {
      throw new ValidationError.CustomError(`maxDepth must be positive integer in range: 1 - ${CHILDREN_MAX_DEPTH.toString()}`);
    }
  }

  static creation = RPV.fieldExistanceGenerator(createAllowedFileds);
  static update = RPV.fieldExistanceGenerator(updateAllowedFileds);
}
