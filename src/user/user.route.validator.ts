import { RouteParamsValidate as RPV, validatorMiddleware as vm } from '../helpers/route.validator';

export class UserRouteParamsValidate extends RPV {
    constructor() {
        super();
    }
}

export const validatorMiddleware = vm;