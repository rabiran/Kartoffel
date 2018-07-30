import { RouteParamsValidate as RPV, validatorMiddleware as vm } from '../../helpers/route.validator';

export class GroupRouteParamsValidate extends RPV {
  constructor() {
    super();
  }
}

export const validatorMiddleware = vm;
