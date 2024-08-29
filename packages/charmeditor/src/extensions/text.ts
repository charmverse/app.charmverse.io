import type { BaseRawNodeSpec } from '../buildSchema';
import { TEXT } from '../nodeNames';

export const spec: BaseRawNodeSpec = {
  type: 'node',
  name: TEXT,
  schema: {
    group: 'inline'
  },
  markdown: {
    toMarkdown(state, node) {
      state.renderInline(node);
    },
    parseMarkdown: {
      paragraph: {
        block: TEXT
      }
    }
  }
};
