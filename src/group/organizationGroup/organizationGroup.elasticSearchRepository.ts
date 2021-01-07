import { ElasticSearchBaseRepository, QueryConfig } from '../../elasticsearch/elasticSearchBaseRepository';
import { OrganizationGroupTextSearch, GroupFilters, GroupQuery } from './organizationGroup.textSearch'
import { Client } from '@elastic/elasticsearch';
import { config } from '../../config/config';
import { IOrganizationGroup } from './organizationGroup.interface';
import * as esb from 'elastic-builder';

const { indexNames: { organizationGroups: _indexName }, defaultFuzzy, fullTextFieldName } = config.elasticSearch;
const Name_Boost_Factor = 1.2;

export class OrganizationGroupElasticSearchRepository 
  extends ElasticSearchBaseRepository<IOrganizationGroup>
  implements OrganizationGroupTextSearch {

    constructor(indexName: string = _indexName, client?: Client, queryConfig?: QueryConfig) {
      super(indexName, client, queryConfig);
    }
    
    searchByNameAndHierarchy(query: Partial<GroupQuery>, filters?: Partial<GroupFilters>) {
      const { nameAndHierarchyTerms } = query;
      const terms = nameAndHierarchyTerms ? 
        (Array.isArray(nameAndHierarchyTerms) ? nameAndHierarchyTerms : [nameAndHierarchyTerms]) 
        : [];
      const should = terms.map(term => esb.boolQuery().should([
        esb.matchQuery(`name.${fullTextFieldName}`, term).boost(Name_Boost_Factor),
        esb.matchQuery(`hierarchy.${fullTextFieldName}`, term),
      ]));
      const queryBody = esb.requestBodySearch().query(
        esb.boolQuery().should(should)
      ).toJSON();

      return this.search(queryBody);
    }
}