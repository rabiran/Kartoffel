import { ElasticSearchBaseRepository, QueryConfig } from '../../elasticsearch/elasticSearchBaseRepository';
import { OrganizationGroupTextSearch, GroupFilters, GroupQuery } from './organizationGroup.textSearch';
import { Client } from '@elastic/elasticsearch';
import { config } from '../../config/config';
import { IOrganizationGroup } from './organizationGroup.interface';
import * as esb from 'elastic-builder';

const { indexNames: { organizationGroups: _indexName }, defaultFuzzy, fullTextFieldName } = config.elasticSearch;
const NAME_BOOST_FACTOR = 1.2;

export class OrganizationGroupElasticSearchRepository 
  extends ElasticSearchBaseRepository<IOrganizationGroup>
  implements OrganizationGroupTextSearch {

  constructor(indexName: string = _indexName, client?: Client, queryConfig?: QueryConfig) {
    super(indexName, client, queryConfig);
  }
  
  async searchByNameAndHierarchy(query: Partial<GroupQuery>, filters: Partial<GroupFilters> = {}) {
    const { underGroupId } = filters;
    const { hierarchy, name } = query;
    const should: esb.Query[] = [];
    const filter: esb.Query[] = [];
    if (!!name) should.push(esb.matchQuery(`name.${fullTextFieldName}`, name).boost(NAME_BOOST_FACTOR));
    if (!!hierarchy) should.push(esb.matchQuery(`hierarchy.${fullTextFieldName}`, hierarchy));
    if (!!underGroupId) filter.push(esb.termQuery('ancestors', underGroupId));
    const queryBody = esb.requestBodySearch().query(
      esb.boolQuery()
      .should(should)
      .filter(filter)
      .minimumShouldMatch(1)
    ).toJSON();
    console.log(JSON.stringify(queryBody));
    return this.search(queryBody);
  }
}

export default new OrganizationGroupElasticSearchRepository();
