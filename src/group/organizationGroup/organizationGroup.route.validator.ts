import { RouteParamsValidate as RPV } from '../../helpers/route.validator';

export const createAllowedFileds = ['name', 'parentId'];

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);
