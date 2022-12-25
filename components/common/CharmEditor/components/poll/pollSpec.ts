import type { RawSpecs } from '@bangle.dev/core';
import type { Node } from '@bangle.dev/pm';

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
      parseDOM: [
        {
          tag: 'poll',
          getAttrs: (dom: any) => {
            return {
              pollId: dom.getAttribute('pollId')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return ['poll', { pollId: node.attrs.pollId }];
      }
    }
  };
}
