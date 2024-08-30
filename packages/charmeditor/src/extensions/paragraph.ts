import type { BaseRawNodeSpec } from '../buildSchema';
import { PARAGRAPH } from '../nodeNames';

export const spec: BaseRawNodeSpec = {
  type: 'node',
  name: PARAGRAPH,
  schema: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0];
    }
  },
  markdown: {
    toMarkdown(state, node) {
      state.renderInline(node);
      state.closeBlock(node);
    },
    parseMarkdown: {
      paragraph: {
        block: PARAGRAPH
      }
    }
  }
};
