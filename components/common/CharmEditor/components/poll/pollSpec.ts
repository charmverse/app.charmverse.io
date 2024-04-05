import type { DOMOutputSpec } from 'prosemirror-model';

import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export const name = 'poll';

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
      selectable: false,
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
