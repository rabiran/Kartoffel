import { ElasticSearchBaseRepository, QueryConfig } from '../../elasticsearch/elasticSearchBaseRepository';
import { OrganizationGroupTextSearch, GroupFilters, GroupQuery } from './organizationGroup.textSearch';
import { Client } from '@elastic/elasticsearch';
import { config } from '../../config/config';
import { IOrganizationGroup } from './organizationGroup.interface';
import * as esb from 'elastic-builder';

type OrganizationGroupSource = IOrganizationGroup & {
  hierarchyPath: string;
};

const { indexNames: { organizationGroups: _indexName }, defaultFuzzy, fullTextFieldName } = config.elasticSearch;
const Name_Boost_Factor = 1.2;

export class OrganizationGroupElasticSearchRepository 
  extends ElasticSearchBaseRepository<OrganizationGroupSource>
  implements OrganizationGroupTextSearch {

  constructor(indexName: string = _indexName, client?: Client, queryConfig?: QueryConfig) {
    super(indexName, client, queryConfig);
  }
  
  async searchByNameAndHierarchy(query: Partial<GroupQuery>, filters: Partial<GroupFilters> = {}) {
    const { nameAndHierarchyTerms } = query;
    const nameHierarchyQueries = nameAndHierarchyTerms ? 
      (Array.isArray(nameAndHierarchyTerms) ? nameAndHierarchyTerms : [nameAndHierarchyTerms]) 
      : [];
    const should = nameHierarchyQueries.map(term => esb.boolQuery().should([
      esb.matchQuery(`name.${fullTextFieldName}`, term).boost(Name_Boost_Factor),
      esb.matchQuery(`hierarchy.${fullTextFieldName}`, term),
    ]));
    const filter = Object.entries(filters).map(
      ([f, value]) => Array.isArray(value) ? 
        esb.termsQuery(f, value) : 
        esb.termQuery(f, value)
    );
    const queryBody = esb.requestBodySearch().query(
      esb.boolQuery()
      .should(should)
      .filter(filter)
      .minimumShouldMatch(1)
    ).toJSON();
    console.log(JSON.stringify(queryBody));
    return (await this.search(queryBody)).map(this.mapSource);
  }

  private mapSource(source: OrganizationGroupSource): IOrganizationGroup {
    const { hierarchyPath, ...rest } = source;
    return rest;
  }
}

export default new OrganizationGroupElasticSearchRepository();
