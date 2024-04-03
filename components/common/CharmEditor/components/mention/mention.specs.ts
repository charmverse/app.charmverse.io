import type { DOMOutputSpec } from 'prosemirror-model';

import type { Member } from 'lib/members/interfaces';

import type { RawSpecs } from '../@bangle.dev/core/specRegistry';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggestTooltipSpec';

import { mentionNodeName, mentionSuggestMarkName, mentionTrigger } from './mention.constants';

export interface MentionSpecSchemaAttrs {
  value: string;
  type: 'user' | 'page' | 'role';
  id: string;
  createdAt: Date;
  createdBy: string;
}

export function mentionSpecs(): RawSpecs {
  const spec = suggestTooltip.spec({ markName: mentionSuggestMarkName, trigger: mentionTrigger });
  return [
    {
      type: 'node',
      name: mentionNodeName,
      schema: {
        attrs: {
          value: {
            default: null
          },
          type: {
            default: 'user'
          },
          id: {
            default: null
          },
          createdAt: {
            default: null
          },
          createdBy: {
            default: null
          }
        },
        inline: true,
        group: 'inline',
        draggable: false,
        atom: true,
        parseDOM: [{ tag: 'span.charm-mention-value' }],
        toDOM: (): DOMOutputSpec => {
          return ['span', { class: 'charm-mention-value' }];
        }
      },
      markdown: {
        toMarkdown: (state, node) => {
          const members = (state.options as any)?.charmOptions?.members as Member[];
          const mentionedUser = members?.find((member) => member.id === node.attrs.value);
          if (mentionedUser) {
            state.write(`@${mentionedUser.username}`);
          }
          return null;
        }
      }
    },
    {
      ...spec,
      options: {
        trigger: mentionTrigger
      }
    }
  ];
}
