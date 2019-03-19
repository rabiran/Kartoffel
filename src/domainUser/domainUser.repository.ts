import { RepositoryBase } from '../helpers/repository';
import { IDomainUser } from './domainUser.interface';
import { DomainUserModel as DomainUser } from './domainUser.model';

export class DomainUserRepository extends RepositoryBase<IDomainUser> {
  constructor() {
    super(DomainUser);
  }

  /**
   * finds one domain user with the given name and one of the given domains
   * @param name 
   * @param domains array of possible domains
   * @param populateOptions 
   * @param select 
   */
  findOneMultipleDomains(name: string, domains: string[], populateOptions?: string | Object, 
    select?: string) {
    const query = {
      name,
      domain: { $in: domains },
    };
    return this.findOne(query, populateOptions, select);
  }
}
