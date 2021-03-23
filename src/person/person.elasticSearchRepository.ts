import { PersonTextSearch, PersonFilters } from './person.textSearch.interface';
import { ElasticSearchBaseRepository, QueryConfig } from '../elasticsearch/elasticSearchBaseRepository';
import { IPerson, IDomainUser, ProfilePictureMeta } from './person.interface';
import { QueryBuilder, FieldContext } from '../elasticsearch/queryBuilder';
import { Client } from '@elastic/elasticsearch';
import { config } from '../config/config';
import { DomainSeperator, domainMap } from '../utils';
import Omit from 'Omit';
import { PersonExcluderQuery } from './person.excluder.query';

type PersonSource = Omit<IPerson, 'pictures'> & {
  hierarchyPath: string;
  pictures?: {
    profile?: {
      url: string;
      meta: ProfilePictureMeta & { path?: string }
    }
  }
};

const { indexNames: { persons: _indexName } } = config.elasticSearch;

class PersonElasticSearchRepository 
extends ElasticSearchBaseRepository<PersonSource> 
implements PersonTextSearch {

  constructor(indexName: string = _indexName, elasticClient?: Client, queryConfig?: QueryConfig) {
    super(indexName, elasticClient, queryConfig);
  }

  async searchByFullName(
    fullName: string, 
    filters?: Partial<PersonFilters>,
    excluderQuery?: Partial<PersonExcluderQuery>
  ) {
    const query = { fullName, ...filters };
    const fieldMapping = {
      fullName: {
        context: FieldContext.Query,
        fuzzy: true,
      },
    };
    const mustNotQuery = this.buildMustNotQuery(excluderQuery || {});
    return (await this.search(
      QueryBuilder.buildBoolQuery(query, fieldMapping ,mustNotQuery)
    ))
    .map(this.transformPersonResult);
  }

  private buildMustNotQuery(excluderQuery: Partial<PersonExcluderQuery>) {
    const { hierarchy: hierarchyPath = null, ...rest } = excluderQuery;
    return {
      ...!!hierarchyPath && { hierarchyPath },
      ...rest,
    };
  }

  private transformPersonResult(person: PersonSource): IPerson {
    const { hierarchyPath, ...tPerson } = { ...person };
    if (tPerson.domainUsers) {
      tPerson.domainUsers = (tPerson.domainUsers as IDomainUser[]).map((u) => {
        const user: Partial<IDomainUser> = {};
        const { dataSource, mail, hierarchy } = u;
        user.uniqueID = `${u.name}${DomainSeperator}${u.domain}`;
        domainMap.get(u.domain) && (user.adfsUID = `${u.name}${DomainSeperator}${domainMap.get(u.domain)}`);
        user.dataSource = u.dataSource;
        if (!!hierarchy) user.hierarchy = hierarchy;
        if (!!mail) user.mail = mail;
        return user as IDomainUser;    
      });
    }
    if (tPerson.pictures && tPerson.pictures.profile) {
      const { format, takenAt, updatedAt } = tPerson.pictures.profile.meta;
      tPerson.pictures.profile.meta = {
        format,
        takenAt,
        updatedAt,
      };
    }
    return tPerson;
  }
}

export default new PersonElasticSearchRepository();
