import { PersonExcluderQuery } from './person.excluder.query';
import { ScopePolicyService } from '../scopes/ScopePolicyService';
import { IPerson } from './person.interface';
import scopePolicy from '../config/scopeRules';

const { scopes, rules: { person } } = scopePolicy;

export default new ScopePolicyService<IPerson, PersonExcluderQuery>(person, scopes);
