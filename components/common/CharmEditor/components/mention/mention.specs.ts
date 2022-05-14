import { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';
import { mentionNodeName, mentionSuggestMarkName, mentionTrigger } from './mention.constants';

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
          }
        },
        inline: true,
        group: 'inline',
        draggable: true,
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
