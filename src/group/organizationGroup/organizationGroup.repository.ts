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
   * Returns array of offsprings
   * @param parentId id of the parent group
   * @param maxDepth if given, offsprings of depth bigger than `maxDepth` will not be returned
   * @param populate 
   * @param select 
   */
  getOffsprings(parentId: string, maxDepth?: number , populate?: string | Object, select?: string) {
    let query;
    if (maxDepth) {
      query = {
        $or: [...Array(maxDepth).keys()].map(index => 
          ({ [`ancestors.${index}`]: ObjectId(parentId) })),
      };
    } else {
      query = { ancestors: ObjectId(parentId) };
    }
    return this.find(query, populate, select);
  }
  
  /**
   * Return array of all IDs of Offspring 
   * @param ancestor_id ID of ancestor
   */
  getOffspringsIds(ancestor_id: string): Promise<IOrganizationGroup[]> {
    return OrganizationGroup.find({ ancestors: ObjectId(ancestor_id) }, 'id').exec();
  }
}
