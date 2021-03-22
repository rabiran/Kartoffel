import policyService from './personScopePolicyService';
import { statisfyExcluder } from '../person.excluder.query';
import { IPerson } from '../person.interface';
import { UnauthorizedError } from '../../types/error';

export default function postTransform(scopes: string[], result: IPerson | IPerson[]) {
  // check if the result should have beeb excluded (only if single result)
  if (!Array.isArray(result)) {
    const excluder = policyService.getQueryFilter(scopes);
    if (statisfyExcluder(result, excluder)) {
      throw new UnauthorizedError();
    }
  }
  // apply transformation
  return Array.isArray(result) ? 
    result.map(person => policyService.applyTransform(person, scopes))
    : policyService.applyTransform(result, scopes);
}
