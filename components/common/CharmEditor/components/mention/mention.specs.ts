import type { RawSpecs } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';

import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';

import { mentionNodeName, mentionSuggestMarkName, mentionTrigger } from './mention.constants';

export interface MentionSpecSchemaAttrs {
  value: string;
  type: 'user' | 'page';
  id: string;
  createdAt: Date;
  createdBy: string;
}

export function mentionSpecs (): RawSpecs {
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
          },
          track: {
            default: []
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
        toMarkdown: () => undefined
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
