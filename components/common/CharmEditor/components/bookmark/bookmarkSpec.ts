import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { DOMOutputSpec } from 'prosemirror-model';

export function spec(): BaseRawNodeSpec {
  return {
    name: 'bookmark',
    type: 'node',
    schema: {
      attrs: {
        url: {
          default: null
        },
        html: {
          default: null
        },
        track: {
          default: []
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-bookmark' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-bookmark'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}
