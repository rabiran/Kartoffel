import * as esb from 'elastic-builder';
import { config } from '../config/config';

export enum FieldContext { Query, Filter }
// export enum FieldFuzziness { AUTO, NONE }

export interface FieldContextMap {
  [key: string]: {
    context: FieldContext,
    fuzzy?: boolean,
    boost?: number
  };
}

const { defaultFuzzy, fullTextFieldMinLength, fullTextFieldName } = config.elasticSearch;

const NO_BOOST = 1;

export class QueryBuilder {
  /**
   * Builds Elasticsearch query object, using the provided field mapping to: determine in what
   * context each field should be used (filter or query), set fuzziness and score boost.
   
   Fields that are not specified in `fieldMapping` will be run in Filter context by default.
   */
  public static buildBoolQuery(query: object, fieldMapping: FieldContextMap) {
    const must: esb.Query[] = [];
    const should: esb.Query[] = [];
    const filter: esb.Query[] = [];
    for (const [field, val] of Object.entries(query)) {
      const fieldMap = fieldMapping[field];
      if (!!fieldMap && fieldMap.context === FieldContext.Query) {
        // ignore non string or too short fields
        if (typeof val === 'string' && val.trim().length >= fullTextFieldMinLength) {
          const fullTextField = QueryBuilder.getFullTextField(field);
          const boost = fieldMap.boost || NO_BOOST;
          const exactQuery = esb.matchQuery(fullTextField, val).boost(boost);
          if (fieldMap.fuzzy) {
            should.push(exactQuery);
            must.push(esb.matchQuery(fullTextField, val).fuzziness(defaultFuzzy));
          } else {
            must.push(exactQuery);
          }
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
  }

  private static getFullTextField(field: string) {
    return `${field}.${fullTextFieldName}`;
  }
}
