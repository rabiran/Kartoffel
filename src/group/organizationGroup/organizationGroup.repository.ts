import { OrganizationGroupModel as OrganizationGroup } from './organizationGroup.model';
import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { RepositoryBase } from '../../helpers/repository';

const ObjectId = mongoose.Types.ObjectId;

export class OrganizationGroupRepository extends RepositoryBase<IOrganizationGroup> {
  constructor() {
    super(OrganizationGroup);
  }
  getOffsprings(ancestor_id: string): Promise<IOrganizationGroup[]> {
    return OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) }).exec();
  }
  // todo: use the repo base? 
  getOffspringsIds(ancestor_id: string): Promise<IOrganizationGroup[]> {
    return OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) }, 'id').exec();
  }
}
