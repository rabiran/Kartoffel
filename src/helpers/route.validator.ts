import { Request, Response, NextFunction, Router } from 'express';
import * as _ from 'lodash';
import { ValidationError } from '../types/error';
import { Types } from 'mongoose';
import { ERS } from '../config/config';

export class RouteParamsValidate {

  static validMongoId(mongoId: any) {
    if (!Types.ObjectId.isValid(mongoId)) {
      throw new ValidationError.InvalidFields(mongoId);
    }
  }

  static validMongoIdArray(arr: any[]) {
    arr.map(RouteParamsValidate.validMongoId);
  }

  static differentParams(param_1: any, param_2: any) {
    if (param_1 === param_2) {
      throw new ValidationError.InvalidFields(param_1, param_2);
    }
  }

  static dateOrInt(param: any) {
    if (!(RouteParamsValidate.isValidDate(param) || RouteParamsValidate.isInt(param))) {
      throw new ValidationError.InvalidFields(param);
    }
  }

  static inRangeGenerator(min: number, max: number) {
    return (val: any) => !isNaN(val) && val >= min && val <= max;
  }

  static fieldExistanceGenerator(allowedfields: string[], requireAll: boolean = false) {
    return (obj: Object) => {
      const diff = _.difference(Object.keys(obj), allowedfields);
      if (diff.length !== 0) {
        throw new ValidationError.UnexpectedFields(diff.toString());
      } else if (requireAll && allowedfields.length !== Object.keys(obj).length) {
        const missingFields = _.difference(allowedfields, Object.keys(obj));
        throw new ValidationError.MissingFields(missingFields.toString());
      }
    };
  }

  private static isValidDate(val: any): Boolean {
    return val instanceof Date;
  }

  static isInt(val: any): Boolean {
    return !isNaN(val) || parseInt(Number(val) + '') === val || !isNaN(parseInt(val, 10));
  }
}

export const validatorMiddleware =
  (validator: Function, varNames: string[] = [], path: string = 'body', errStatus:number = 400) =>
  (req: Request, res: Response, next: NextFunction) => {
    const usePath = !varNames || varNames.length === 0;
    const vars = usePath ? [req[path]] : varNames.map(varName => req[path][varName]);
    try {
      const result = validator(...vars);
      next();
    } catch (err) {
      next(err); // pass to the error handling middleware
    }
  };
