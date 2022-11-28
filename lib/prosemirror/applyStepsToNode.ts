import type { Node } from '@bangle.dev/pm';
import { Step } from '@bangle.dev/pm';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { ProsemirrorJSONStep } from 'lib/websockets/documentEvents/interfaces';

export function applyStepsToNode(steps: ProsemirrorJSONStep[], node: Node): Node {
  return steps.reduce<Node>((n, stepJson) => {
    const step = Step.fromJSON(specRegistry.schema, stepJson);
    const res = step.apply(n);
    if (res.doc) {
      return res.doc;
    } else {
      throw new Error('Failed to apply step');
    }
  }, node);
}
