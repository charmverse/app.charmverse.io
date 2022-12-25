import type { RawSpecs } from '@bangle.dev/core';
import type { DOMOutputSpec, Node } from '@bangle.dev/pm';

import { name } from './config';

export type NodeAttrs = {
  pollId: string | null;
};

export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: () => null
    },
    schema: {
      attrs: {
        pollId: {
          default: null
        },
        track: {
          default: []
        }
      },
      group: 'block',
      inline: false,
      draggable: false,
      parseDOM: [{ tag: 'div.charm-poll' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-poll'];
      }
    }
  };
}
