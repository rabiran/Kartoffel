import { Request, Response, NextFunction } from 'express';
import { KeyMap, ValueMap, transformKeys, ObjectValueMap,
  transformValues, filterObjectByKeys } from '../utils';

interface TransformOpts {
  renameMap?: KeyMap;
  selectFields?: string[];
  defaults?: ValueMap;
  valuesAliases?: ObjectValueMap;
}

/**
 * Extracts specific fields from an object (case insesitive), then renames them 
 * according to the given `renameMap`, then adds default values to missing fields
 * using the given `defaults` and finally uses the `valuesAliases` to replace 
 * some field values' aliases with the 'real' values.
 * Returns a new object.
 * 
 * @param original original object
 * @param transformOpts object with the following fields:  
 * @property `selectFields` - fields to select - returned object will have only 
 *        a subset of these keys, omitting this option will select all fields
 * @property `renameMap` - maps original fields names to new names
 * @property `defaults` - maps a field to its default value (if there is)
 * @property `valuesAliases` - maps a field to its alias map - which by itslef maps 
 * a field original value ('alias') to a new value
 */
export function transformQueryFields(
  original: object, transformOpts: TransformOpts = {}) {
  const {
    selectFields = null,
    renameMap = {},
    defaults = {}, 
    valuesAliases = {},
  } = transformOpts;
  // filter fields
  const filtered = selectFields ? filterObjectByKeys(original, selectFields, true) :
    { ...original };
  // rename fields
  const renamed = transformKeys(filtered, renameMap);
  // apply defaults
  const withDefaults = { ...defaults, ...renamed };
  // apply values aliases and return 
  return transformValues(withDefaults, valuesAliases);
}
