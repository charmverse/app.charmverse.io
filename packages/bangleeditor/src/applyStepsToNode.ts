import { log } from '@packages/core/log';
import type { ProsemirrorJSONStep } from '@packages/websockets/documentEvents/interfaces';
import type { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';

import { specRegistry } from './specRegistry';

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
      log.warn(`An error occurred when applying prosemirror step:`, stepJson);
      throw err;
    }
  }, node);
}
