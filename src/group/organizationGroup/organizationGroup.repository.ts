import { OrganizationGroupModel as OrganizationGroup } from './organizationGroup.model';
import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { RepositoryBase } from '../../helpers/repository';

const ObjectId = mongoose.Types.ObjectId;

export class OrganizationGroupRepository extends RepositoryBase<IOrganizationGroup> {
  constructor() {
    super(OrganizationGroup);
  }
  getOffsprings(ancestor_id: string, selectField?: string[], cond?: object): Promise<mongoose.Document[]> {
    const query = OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) });
    if (selectField) {
      !selectField.includes('id') ? selectField.push('id') : selectField; 
      query.select(selectField.join(' '));
    }
    if (cond) query.where(cond);
    return query.exec();
  }

  getOffspringsIds(ancestor_id: string): Promise<mongoose.Document[]> {
    return OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) }, 'id').exec();
  }
}
