import { RepositoryBase } from '../helpers/repository';
import { IDomainUser } from './domainUser.interface';
import { DomainUserModel as DomainUser } from './domainUser.model';

class DomainUserRepository extends RepositoryBase<IDomainUser> {
  constructor() {
    super(DomainUser);
  }
}

const repoInstance = new DomainUserRepository();

export const Repository = repoInstance;
