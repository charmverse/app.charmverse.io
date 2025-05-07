import type { DOMOutputSpec, Node } from 'prosemirror-model';

import type { Member } from '@packages/lib/members/interfaces';

import type { BaseRawMarkSpec, RawSpecs } from '../@bangle.dev/core/specRegistry';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggestTooltipSpec';

import { mentionNodeName, mentionSuggestMarkName, mentionTrigger } from './mention.constants';

export interface MentionSpecSchemaAttrs {
  value: string;
  type: 'user' | 'page' | 'role';
  id: string;
  createdAt: Date;
  createdBy: string;
}

// This is used in the serialiser. The spec registry imports mentionSpecs, which contains the mention node and mentionSuggest mark
export function mentionSuggestSpec(): BaseRawMarkSpec {
  return {
    ...suggestTooltip.spec({ markName: mentionSuggestMarkName, trigger: mentionTrigger }),
    type: 'mark',
    markdown: {
      toMarkdown: {
        open: '',
        close: '',
        mixable: false,
        expelEnclosingWhitespace: true
      }
    }
  } as BaseRawMarkSpec;
}

export function mentionSpecs(): RawSpecs[] {
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
        parseDOM: [
          {
            tag: 'span.charm-mention-value',
            getAttrs: (dom: any) => {
              return {
                type: dom.getAttribute('data-type'),
                value: dom.getAttribute('data-value'),
                id: dom.getAttribute('data-id')
              };
            }
          }
        ],
        toDOM: (node: Node): DOMOutputSpec => {
          return [
            'span',
            {
              class: 'charm-mention-value',
              'data-type': node.attrs.type,
              'data-value': node.attrs.value,
              'data-id': node.attrs.id
            }
          ];
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
    mentionSuggestSpec()
  ];
}
