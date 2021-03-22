import { ScopePolicyService } from '../../../scopes/ScopePolicyService';
import { IOrganizationGroup } from '../organizationGroup.interface';
import { GroupExcluderQuery } from '../organizationGroup.excluder.query';
import policies from '../../../config/scopePolicies';

const { scopes, rules: { organizationGroup } } = policies;

const policyService = new ScopePolicyService<IOrganizationGroup, GroupExcluderQuery>(organizationGroup, scopes);

export default policyService;
