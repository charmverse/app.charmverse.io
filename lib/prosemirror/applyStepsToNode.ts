import type { Node } from '@bangle.dev/pm';
import { Step } from '@bangle.dev/pm';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';

export function applyStepsToNode (steps: Step[], node: Node): Node {
  return steps.reduce<Node>((n, stepJson) => {
    const step = Step.fromJSON(specRegistry.schema, stepJson);
    const res = step.apply(n);
    if (res.doc) {
      return res.doc;
    }
    else {
      throw new Error('Failed to apply step');
    }
  }, node);
}
