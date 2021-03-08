import { Condition } from './Condition';
import { getByPath } from '../../../utils';

export class SimpleValueCondition extends Condition {
  private fieldPath: string[];
  private value: any;

  constructor(fieldPath: string[], value: any) {
    super();
    this.fieldPath = fieldPath;
    this.value = value;
  }

  check(source: any) {
    return getByPath(source, this.fieldPath) === this.value;
  }
}
