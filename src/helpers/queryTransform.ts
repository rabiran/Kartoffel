import { Request, Response, NextFunction } from 'express';
import { KeyMap, ValueMap, transformKeys, ObjectValueMap,
  transformValues, filterObjectByKeys } from '../utils';

// const b: TransformOptions = {
//   aliases: {
//     amn: ['vatfff',9],
//   },
//   defaults: {

//   }     
// };





function transformQuery(
  original: object,
  keysTransform: KeyMap = {},
  allowedKeys: string[],
  defaults: ValueMap = {}, 
  aliases: ObjectValueMap = {}) {
  // transform keys and filter
  const filtered = filterObjectByKeys(transformKeys(original, keysTransform), allowedKeys);
  // apply defaults
  const tQuery = { ...defaults, ...filtered };
  // swap aliases and return 
  return transformValues(tQuery, aliases);
}

export const makeMiddleware = (
  keysTransform: KeyMap = {},
  allowedKeys: string[],
  defaults: ValueMap = {}, 
  aliases: ObjectValueMap = {}) => 
  (req: Request, res: Response, next: NextFunction) => {
    req.query = transformQuery(req.query, keysTransform, allowedKeys, defaults, aliases);
    next();
  };

