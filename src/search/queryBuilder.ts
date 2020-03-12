import * as esb from 'elastic-builder';
import { config } from '../config/config';

export enum FieldType { FullText, Filter }

interface FieldTypeMap {
  [key: string]: FieldType;
}

const { defaultFuzzy, fullTextFieldName, fullTextFieldMinLength } = config.elasticSearch;

export const queryParser = (queryObj: object, fieldMap: FieldTypeMap) => {
  const must: esb.Query[] = [];
  const should: esb.Query[] = [];
  const filter: esb.Query[] = [];
  for (const [field, val] of Object.entries(queryObj)) {
    if (fieldMap[field] === FieldType.FullText) {
      // ignore non string or too short fields
      if (typeof val === 'string' && val.trim().length >= fullTextFieldMinLength) {
        const fullTextField = getFullTextField(field);
        should.push(esb.matchQuery(fullTextField, val));
        must.push(esb.matchQuery(fullTextField, val).fuzziness(defaultFuzzy));
      }
    } else { // defaults to FieldType.Filter
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
