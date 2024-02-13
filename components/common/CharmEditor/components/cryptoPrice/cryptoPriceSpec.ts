import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from '../@bangle.dev/core/specRegistry';

/**
 * TODO - Implement spec
 * @returns
 */
export function spec(): BaseRawNodeSpec {
  return {
    name: 'cryptoPrice',
    type: 'node',
    schema: {
      attrs: {
        base: {
          default: null
        },
        quote: {
          default: null
        },
        track: {
          default: []
        }
      },
      draggable: true,
      group: 'block',
      parseDOM: [{ tag: 'div.charm-crypto-price' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-crypto-price'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}
