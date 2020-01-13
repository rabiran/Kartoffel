import { OrganizationGroupModel as OrganizationGroup } from './organizationGroup.model';
import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { RepositoryBase } from '../../helpers/repository';

const ObjectId = mongoose.Types.ObjectId;

export class OrganizationGroupRepository extends RepositoryBase<IOrganizationGroup> {
  constructor() {
    super(OrganizationGroup);
  }

  /**
   * return array of offspring according to the condition
   * @param ancestor_id ID of ancestor
   * @param selectField fields to select
   * @param cond condition
   */
  getOffsprings(ancestor_id: string, selectField?: string[], cond?: object): Promise<IOrganizationGroup[]> {
    const query = OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) });
    if (selectField) {
      !selectField.includes('id') ? selectField.push('id') : selectField; 
      query.select(selectField.join(' '));
    }
    if (cond) query.where(cond);
    return query.exec();
  }
  
  /**
   * Return array of all IDs of Offspring 
   * @param ancestor_id ID of ancestor
   */
  getOffspringsIds(ancestor_id: string): Promise<IOrganizationGroup[]> {
    return OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) }, 'id').exec();
  }
}
