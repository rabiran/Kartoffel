import { PersonModel as Person } from './person.model';
import { IPerson } from './person.interface';
import { RepositoryBase, ICollection } from '../helpers/repository';
import * as mongoose from 'mongoose';

export class PersonRepository extends RepositoryBase<IPerson> {
  constructor() {
    super(Person);
  }

  getMembersOfGroups(organizationGroupsIDS: string[]): Promise<IPerson[]> {
    return Person.find({ directGroup: { $in: organizationGroupsIDS } }).exec();
  }
}
