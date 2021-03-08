import { Condition } from './Condition';
import { getByPath } from '../../../utils';

export class HierarchyCondition extends Condition {
  private fieldPath: string[];
  private hierarchiesToCheck: string[];

  constructor(fieldPath: string[], hierarchiesToCheck: string[]) {
    super();
    this.fieldPath = fieldPath;
    this.hierarchiesToCheck = hierarchiesToCheck;
  }

  check(source: any) {
    const hierarchyField = getByPath(source, this.fieldPath);
    let hierarchyString = '';
    if (Array.isArray(hierarchyField)) {
      hierarchyString = hierarchyField.join('/');
    } else if (typeof hierarchyField === 'string') {
      hierarchyString = hierarchyField;
    }
    for (const hierarchy of this.hierarchiesToCheck) {
      if (hierarchyString.startsWith(hierarchy)) {
        return true;
      }
    }
    
    return false;
  }
}
