import type { Node } from 'prosemirror-model';

import type { BaseRawNodeSpec } from '../@bangle.dev/core/specRegistry';

export const spec = specFactory;

const name = 'text';

function specFactory(): BaseRawNodeSpec {
  return {
    type: 'node',
    name,
    schema: {
      group: 'inline'
    },
    markdown: {
      toMarkdown(state: any, node: Node) {
        state.text(node.text);
      }
    }
  };
}
