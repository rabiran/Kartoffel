import ConditionFactory from './ConditionFactory';
import { HierarchyCondition } from './HierarchyCondition';
import { SimpleValueCondition } from './SimpleValueCondition';

export function registerToFactory() {
  ConditionFactory.registerClass(HierarchyCondition.name, HierarchyCondition);
  ConditionFactory.registerClass(SimpleValueCondition.name, SimpleValueCondition);
}
