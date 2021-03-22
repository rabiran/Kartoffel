import policyService from './groupScopePolicyService';
import { statisfyExcluder } from '../organizationGroup.excluder.query';
import { IOrganizationGroup } from '../organizationGroup.interface';
import { UnauthorizedError } from '../../../types/error';

export default function postTransform(scopes: string[], result: IOrganizationGroup | IOrganizationGroup[]) {
  // check if the result should have beeb excluded (only if single result)
  if (!Array.isArray(result)) {
    const excluder = policyService.getQueryFilter(scopes);
    if (statisfyExcluder(result, excluder)) {
      throw new UnauthorizedError();
    }
  }
  // apply transformation
  return Array.isArray(result) ? 
    result.map(group => policyService.applyTransform(group, scopes))
    : policyService.applyTransform(result, scopes);
}
