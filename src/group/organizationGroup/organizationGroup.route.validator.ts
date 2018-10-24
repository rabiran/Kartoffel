import { RouteParamsValidate as RPV, validatorMiddleware as vm } from '../../helpers/route.validator';

export const createAllowedFileds = ['name', 'parentId'];

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);
