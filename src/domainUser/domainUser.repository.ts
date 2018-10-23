import { RepositoryBase } from '../helpers/repository';
import { IDomainUser } from './domainUser.interface';
import { DomainUserModel as DomainUser } from './domainUser.model';

export class DomainUserRepository extends RepositoryBase<IDomainUser> {
  constructor() {
    super(DomainUser);
  }
}
