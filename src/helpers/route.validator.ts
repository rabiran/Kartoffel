import { Request, Response, NextFunction, Router } from 'express';
import * as _ from 'lodash';

export class RouteParamsValidate {

  static startsWithAnA(str: string) {
    if (str[0] !== 'A') {
      throw new Error('Does not start with an A!');
    }
  }

  static toDo() {
    return;
  }

  static differentParams(param_1: any, param_2: any) {
    if (param_1 === param_2) {
      throw new Error('Cannot receive identical parameters!');
    }
  }

  static dateOrInt(param: any) {
    if (!(RouteParamsValidate.isValidDate(param) || RouteParamsValidate.isInt(param))) {
      throw new Error('Did not receive a valid date ;)');
    }
  }

  static fieldExistanceGenerator(requiredfields: string[], allowOtherfields: boolean = false) {
    return (obj: Object) => {
      const hasAll = _.has(obj, requiredfields);
      const tothrow = allowOtherfields ? hasAll : 
        hasAll && Object.keys(obj).length === requiredfields.length;
      if (tothrow) {
        throw new Error('sdfsdf');
      }
    };
  }

  private static isValidDate(val: any): Boolean {
    return val instanceof Date;
  }

  private static isInt(val: any): Boolean {
    return !isNaN(val) || parseInt(Number(val) + '') === val || !isNaN(parseInt(val, 10));
  }
}

export const validatorMiddleware =
  (validator: Function, varNames: string[], path: string = 'body', errStatus:number = 400) =>
  (req: Request, res: Response, next: NextFunction) => {
    const vars = varNames.map(varName => req[path][varName]);
    try {
      const result = validator(...vars);
      next();
    } catch (err) {
      res.status(errStatus).send(err.message);
    }
  };
