import * as esb from 'elastic-builder';
import { config } from '../config/config';

export enum FieldContext { Query, Filter }

interface FieldContextMap {
  [key: string]: FieldContext;
}

const { defaultFuzzy, fullTextFieldName, fullTextFieldMinLength } = config.elasticSearch;

/**
 * Builds Elasticsearch query object, using the provided field map to determine in what 
 * context each field should be used (filter or query). 
 * Fields that are not specified in `fieldMap` will be run in Filter context by default.
 * @param queryObj 
 * @param fieldMap map field (keys) to its query clause context (values)
 * @returns Elasticsearch query object
 */
export const queryParser = (queryObj: object, fieldMap: FieldContextMap) => {
  const must: esb.Query[] = [];
  const should: esb.Query[] = [];
  const filter: esb.Query[] = [];
  for (const [field, val] of Object.entries(queryObj)) {
    if (fieldMap[field] === FieldContext.Query) {
      // ignore non string or too short fields
      if (typeof val === 'string' && val.trim().length >= fullTextFieldMinLength) {
        const fullTextField = getFullTextField(field);
        should.push(esb.matchQuery(fullTextField, val));
        must.push(esb.matchQuery(fullTextField, val).fuzziness(defaultFuzzy));
      }
    } else { // defaults to FieldContext.Filter
      const termQuery = Array.isArray(val) ? 
        esb.termsQuery(field, val) : 
        esb.termQuery(field, val);
      filter.push(termQuery);
    }
  }
  return esb.requestBodySearch().query(
    esb.boolQuery()
      .must(must)
      .should(should)
      .filter(filter)
  ).toJSON();
};

const getFullTextField = (field: string) => `${field}.${fullTextFieldName}`;
