import { GroupExcluderQuery } from './organizationGroup.excluder.query';
import { ScopePolicyService } from '../../scopes/ScopePolicyService';
import { IOrganizationGroup } from './organizationGroup.interface';
import scopePolicy from '../../config/scopeRules';

const { scopes, rules: { organizationGroup } } = scopePolicy;

export default new ScopePolicyService<IOrganizationGroup, GroupExcluderQuery>(organizationGroup, scopes);
