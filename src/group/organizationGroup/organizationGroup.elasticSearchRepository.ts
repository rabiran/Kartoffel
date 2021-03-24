import { ElasticSearchBaseRepository, QueryConfig } from '../../elasticsearch/elasticSearchBaseRepository';
import { OrganizationGroupTextSearch, GroupFilters, GroupQuery } from './organizationGroup.textSearch';
import { Client } from '@elastic/elasticsearch';
import { config } from '../../config/config';
import { IOrganizationGroup } from './organizationGroup.interface';
import * as esb from 'elastic-builder';
import { GroupExcluderQuery } from './organizationGroup.excluder.query';

const { indexNames: { organizationGroups: _indexName }, defaultFuzzy, fullTextFieldName } = config.elasticSearch;
const NAME_BOOST_FACTOR = 1.2;

type GroupSource = IOrganizationGroup & {
  hierarchyPath: string;
};

export class OrganizationGroupElasticSearchRepository 
  extends ElasticSearchBaseRepository<GroupSource>
  implements OrganizationGroupTextSearch {

  constructor(indexName: string = _indexName, client?: Client, queryConfig?: QueryConfig) {
    super(indexName, client, queryConfig);
  }
  
  async searchByNameAndHierarchy(
    query: Partial<GroupQuery>, 
    filters: Partial<GroupFilters> = {},
    excluderQuery?: Partial<GroupExcluderQuery>
  ) {
    const { underGroupId, isAlive } = filters;
    const { hierarchy, name } = query;
    const should: esb.Query[] = [];
    const filter: esb.Query[] = [];
    const mustNot: esb.Query[] = this.buildMustNotQuery(excluderQuery || {});
    if (!!name) {
      should.push(esb.matchQuery(`name.${fullTextFieldName}`, name).boost(NAME_BOOST_FACTOR));
      should.push(esb.matchQuery(`name.${fullTextFieldName}`, name).fuzziness(defaultFuzzy));
    }
    if (!!hierarchy) should.push(esb.matchQuery(`hierarchy.${fullTextFieldName}`, hierarchy));
    if (!!underGroupId) filter.push(esb.termQuery('ancestors', underGroupId));
    if (isAlive !== undefined) filter.push(esb.termQuery('isAlive', isAlive));

    const queryBody = esb.requestBodySearch().query(
      esb.boolQuery()
      .should(should)
      .mustNot(mustNot)
      .filter(filter)
      .minimumShouldMatch(1)
    ).toJSON();
    return (await this.search(queryBody)).map(this.transformGroup);
  }
  
  private buildMustNotQuery(excluderQuery: Partial<GroupExcluderQuery>) {
    const { hierarchy: hierarchyPath, ...rest } = excluderQuery;
    const renamedQuery = {
      ...!!hierarchyPath && {
        hierarchyPath,
      },
      ...rest,
    };
    return Object.keys(renamedQuery).map(k => esb.termsQuery(k, renamedQuery[k]));
  }

  private transformGroup(source: GroupSource): IOrganizationGroup {
    const { hierarchyPath, ...rest } = source;
    return rest;
  }
}

export default new OrganizationGroupElasticSearchRepository();
