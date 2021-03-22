import { ScopePolicyService } from '../../scopes/ScopePolicyService';
import { IPerson } from '../person.interface';
import { PersonExcluderQuery } from '../person.excluder.query';
import policies from '../../config/scopePolicies';

const { scopes, rules: { person } } = policies;

const policyService = new ScopePolicyService<IPerson, PersonExcluderQuery>(person, scopes);

export default policyService;
