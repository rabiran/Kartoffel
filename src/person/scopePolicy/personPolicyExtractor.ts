import policyService from './personScopePolicyService';

const extract = (scopes: string[]) => policyService.getQueryFilter(scopes);

export default extract;
