import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from '../@bangle.dev/core/specRegistry';

export function specs(): BaseRawNodeSpec {
  return {
    name: 'file',
    type: 'node',
    schema: {
      attrs: {
        src: {
          default: null
        },
        name: {
          default: ''
        },
        size: {
          default: null
        },
        track: {
          default: []
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-file' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-file'];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        const { src, name } = node.attrs;

        if (src) {
          const toWrite = `![${name || ''}](${src})`;
          state.text(toWrite, false);
          state.ensureNewLine();
        }
      }
    }
  };
}
