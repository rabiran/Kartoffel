import { Request, Response, NextFunction } from 'express';
import { KeyMap, ValueMap, transformKeys, ObjectValueMap,
  transformValues, filterObjectByKeys } from '../utils';


function transformQuery(
  originalQuery: object,
  queryParamsRenameMap: KeyMap = {},
  filterQueryParams: string[] = null,
  queryDefaults: ValueMap = {}, 
  queryValuesAliases: ObjectValueMap = {}) {
  // rename query params
  const renamed = transformKeys(originalQuery, queryParamsRenameMap);
  // filter params
  const filtered = filterQueryParams ? filterObjectByKeys(renamed, filterQueryParams) : renamed;
  // apply defaults
  const tQuery = { ...queryDefaults, ...filtered };
  // apply values aliases and return 
  return transformValues(tQuery, queryValuesAliases);
}

export const makeMiddleware = (
  queryParamsRenameMap: KeyMap = {},
  filterQueryParams: string[] = null,
  queryDefaults: ValueMap = {}, 
  queryValuesAliases: ObjectValueMap = {}) => 
  (req: Request, res: Response, next: NextFunction) => {
    req.query = transformQuery(req.query, queryParamsRenameMap, filterQueryParams, queryDefaults, queryValuesAliases);
    next();
  };

