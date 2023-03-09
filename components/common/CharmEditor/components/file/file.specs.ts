import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';

export function specs(): BaseRawNodeSpec {
  return {
    name: 'file',
    type: 'node',
    schema: {
      attrs: {
        src: {
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
      toMarkdown: () => null
    }
  };
}
