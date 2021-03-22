import policyService from './groupScopePolicyService';

const extract = (scopes: string[]) => policyService.getQueryFilter(scopes);

export default extract;
