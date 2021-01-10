import { PersonTextSearch, PersonSearchQuery } from './person.textSearch.interface';
import { ElasticSearchBaseRepository, QueryConfig } from '../elasticsearch/elasticSearchBaseRepository';
import { IPerson, IDomainUser } from './person.interface';
import { QueryBuilder, FieldContext } from '../elasticsearch/queryBuilder';
import { Client } from '@elastic/elasticsearch';
import { config } from '../config/config';
import { DomainSeperator, domainMap } from '../utils';

type PersonSource = IPerson & {
  hierarchyPath: string;
};

const { indexNames: { persons: indexName } } = config.elasticSearch;

class PersonElasticSearchRepository extends ElasticSearchBaseRepository<IPerson> implements PersonTextSearch {

  constructor(elasticClient?: Client, queryConfig?: QueryConfig) {
    super(indexName, elasticClient, queryConfig);
  }

  async searchByQuery(query: PersonSearchQuery) {
    const body = QueryBuilder.buildBoolQuery(query, {
      fullName: {
        context: FieldContext.Query,
        fuzzy: true,
      },
    });
    console.log(JSON.stringify(query));
    console.log(JSON.stringify(body));
    return (await this.search(
      QueryBuilder.buildBoolQuery(query, {
        fullName: {
          context: FieldContext.Query,
          fuzzy: true,
        },
      })
    ))
    .map(this.transformPersonResult);
  }

  async findById(id: string) {
    const res = await super.findById(id);
    return this.transformPersonResult(res as PersonSource);
  }

  private transformPersonResult(person: PersonSource): IPerson {
    const { hierarchyPath, ...tPerson } = { ...person };
    if (!tPerson.domainUsers) return tPerson;
    tPerson.domainUsers = (tPerson.domainUsers as IDomainUser[]).map((u) => {
      const user: Partial<IDomainUser> = {};
      user.uniqueID = `${u.name}${DomainSeperator}${u.domain}`;
      domainMap.get(u.domain) && (user.adfsUID = `${u.name}${DomainSeperator}${domainMap.get(u.domain)}`);
      user.dataSource = u.dataSource;
      return user as IDomainUser;    
    });
    return tPerson;
  }
}

export default new PersonElasticSearchRepository();
