import { IOrganizationGroup } from './organizationGroup.interface';
import { isHierarchyUnderPath } from '../../utils';

export type GroupExcluderQuery = {
  hierarchy: string[];
  akaUnit: string[];
};

export function statisfyExcluder(group: IOrganizationGroup, excluder: Partial<GroupExcluderQuery>) {
  const { hierarchy = [], ...rest } = excluder;
  // check if group is under one of the excluded hierarchies
  for (const hierarchyPath of hierarchy) {
    const groupFullPath = [...group.hierarchy, group.name].join('/');
    if (isHierarchyUnderPath(groupFullPath, hierarchyPath)) {
      return true;
    }
  }
  // check if group statisfied the other excluders
  for (const key of Object.keys(rest)) {
    const excluded: string[] = rest[key];
    if (excluded.includes(group[key])) {
      return true;
    }
  }
  return false;
}
