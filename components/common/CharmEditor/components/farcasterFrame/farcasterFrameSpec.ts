import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from '../@bangle.dev/core/specRegistry';

export function spec(): BaseRawNodeSpec {
  return {
    name: 'farcasterFrame',
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
      draggable: true,
      group: 'block',
      parseDOM: [{ tag: 'div.charm-farcaster-frame' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-farcaster-frame'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}
