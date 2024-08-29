import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from '../buildSchema';
import { TAB_INDENT } from '../nodeNames';

export const tabIndentSpec: BaseRawNodeSpec = {
  type: 'node',
  name: TAB_INDENT,
  schema: {
    inline: true,
    group: 'inline',
    parseDOM: [{ tag: 'span.charm-tab' }],
    toDOM: (node): DOMOutputSpec => [
      'span',
      { class: 'charm-tab', 'data-indent': node.attrs.indent || 0, style: 'white-space:pre' },
      '\t'
    ],
    attrs: {
      indent: { default: 0 }
    }
  },
  markdown: {
    toMarkdown: () => null
  }
};
