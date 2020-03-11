import * as esb from 'elastic-builder';

export enum FieldType { FullText, Filter }

interface FieldTypeMap {
  [key: string]: FieldType;
}

function queryParser(queryObj: object, fieldMap: FieldTypeMap) {
  const base = esb.boolQuery();
  const fullText: esb.Query[] = [];
  const filter: esb.Query[] = [];
  for (const field of Object.keys(queryObj)) {
    const val = queryObj[field];
    if (fieldMap[field] === FieldType.Filter) {
      const termQuery = Array.isArray(val) ? esb.termsQuery() : esb.termQuery();
      filter.push(termQuery.field(field).value(val));
    } else {
      const fullTextField = `${field}.autocomplete`;
      fullText.concat([
        esb.matchQuery(fullTextField, val).fuzziness('AUTO'),
        esb.matchQuery(fullTextField, val),
      ]);
    }
  }

}

esb.requestBodySearch().query(esb.boolQuery())