import type { Node } from '@bangle.dev/pm';
import { Step } from '@bangle.dev/pm';
import { log } from '@charmverse/core/log';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { ProsemirrorJSONStep } from 'lib/websockets/documentEvents/interfaces';

export function applyStepsToNode(steps: ProsemirrorJSONStep[], node: Node): Node {
  return steps.reduce<Node>((n, stepJson, index) => {
    try {
      const step = Step.fromJSON(specRegistry.schema, stepJson);
      const res = step.apply(n);
      if (res.doc) {
        return res.doc;
      } else {
        log.warn('Could not apply step', { res, stepJson });
        throw new Error('Failed to apply step');
      }
    } catch (err) {
      log.warn(`An error occurred at step number`, index, 'with step', stepJson);
      throw err;
    }
  }, node);
}
