import { search } from '../search/elasticsearch';
import { queryParser, FieldContext } from '../search/queryBuilder';
import { IPerson } from './person.interface';
import { transformDomainUser } from './person.utils';
import { config } from '../config/config';

const { personsIndexName, defaultResultLimit } = config.elasticSearch;

const fieldTypes = {
  fullName: FieldContext.Query,
  // the rest of the fields are treated as FieldType.Filter by default
};

export const searchQuery = async (queryObj: object, size: number = defaultResultLimit) => {
  const query = queryParser(queryObj, fieldTypes);
  const results = await search(personsIndexName, size, query);
  return results.map(transformDomainUser);
};

