import { RepositoryBase } from '../helpers/repository';
import { IDomainUser } from './domainUser.interface';
import { DomainUserModel as DomainUser } from './domainUser.model';

export class DomainUserRepository extends RepositoryBase<IDomainUser> {
  constructor() {
    super(DomainUser);
  }

  findOneMultipleDomains(name: string, domains: string[], populateOptions?: string | Object, 
    select?: string) {
    const query = {
      name,
      domain: { $in: domains },
    };
    return this.findOne(query, populateOptions, select);
  }
}
