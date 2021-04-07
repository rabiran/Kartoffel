import { OrganizationGroupModel as OrganizationGroup } from './organizationGroup.model';
import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { RepositoryBase } from '../../helpers/repository';
import { GroupExcluderQuery } from './organizationGroup.excluder.query';

const ObjectId = mongoose.Types.ObjectId;

export class OrganizationGroupRepository extends RepositoryBase<IOrganizationGroup> {
  constructor() {
    super(OrganizationGroup);
  }

  private async buildExcluderQuery(excluderQuery: Partial<GroupExcluderQuery>) {
    const { hierarchy = [], ...rest } = excluderQuery;
    // find all groups with hierarchy + name that matches `hierarchy` array (of hierarchy paths)
    const ancestors = (await Promise.all(hierarchy.map((hierarchyPath) => {
      // split each hierarchyPath to name and hierarchy array
      const hierarchyPathArray = hierarchyPath.split('/');
      const hierarchyArray = hierarchyPathArray.slice(0, hierarchyPathArray.length - 1);
      const name = hierarchyPathArray[hierarchyPathArray.length - 1];
      return this.findOne({ name, hierarchy: hierarchyArray }, null, 'id');
    })))
    .filter(g => !!g)
    .map(group => ObjectId(group.id)); // convert to ObjectId array
    return {
      ...ancestors.length > 0 && {
        ancestors,
        _id: ancestors,
      },
      ...rest,
    };
  }

  async findByFilter(
    queryObj: any, 
    excluderQuery: Partial<GroupExcluderQuery> = {}, 
    populate?: string | Object, 
    select?: string
  ): Promise<IOrganizationGroup[]> {
    const notInQuery = await this.buildExcluderQuery(excluderQuery);
    return this.find({
      $and:[
        { ...this.queryParser(queryObj) },
        { ...this.queryParser(notInQuery, true) },
      ]}, populate, select);
  }

  async getUpdatedFrom(
    from: Date,
    to: Date,
    queryObj: any = {},
    excluderQuery: Partial<GroupExcluderQuery> = {}
  ) {
    const fullExcluderQuery = this.queryParser(await this.buildExcluderQuery(excluderQuery), true);
    const dateQuery = this.updatedFromQuery(from, to);
    const query = queryObj ? this.queryParser(queryObj) : {};
    return this.find({
      $and: [
        { ...dateQuery, ...query },
        { ...fullExcluderQuery },
      ]});
  }

  /**
   * Returns array of offsprings
   * @param parentId id of the parent group
   * @param maxDepth if given, offsprings of depth bigger than `maxDepth` will not be returned
   * @param excluderQuery query for groups that should not be returned as part of the result
   * @param populate 
   * @param select 
   */
  async getOffsprings(
    parentId: string,
    maxDepth?: number, 
    excluderQuery?: Partial<GroupExcluderQuery>,
    populate?: string | Object, 
    select?: string
  ) {
    let query;
    const fullExcluderQuery = excluderQuery ? 
      this.queryParser(await this.buildExcluderQuery(excluderQuery), true) 
      : {};
    if (maxDepth) {
      query = {
        $and: [
          { 
            $or: [...Array(maxDepth).keys()].map(index => 
            ({ [`ancestors.${index}`]: ObjectId(parentId) })),
          },
          { ...fullExcluderQuery },
        ],
      };
    } else {
      query = { 
        $and: [
          { ancestors: ObjectId(parentId) },
          { ...fullExcluderQuery },
        ],
      };
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
