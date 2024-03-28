import type { DOMOutputSpec } from '@bangle.dev/pm';
import { log } from '@charmverse/core/log';

import type { RawSpecs } from '../@bangle.dev/core/specRegistry';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';
import { encloseNestedPage } from '../nestedPage/nestedPage.utils';

import { linkedPageNodeName, linkedPageSuggestMarkName } from './linkedPage.constants';

export function linkedPageSpec(): RawSpecs {
  return [
    {
      type: 'node',
      name: linkedPageNodeName,
      schema: {
        inline: false,
        attrs: {
          id: {
            default: null
          },
          type: {
            default: null
          },
          path: {
            default: null
          },
          track: {
            default: []
          }
        },
        group: 'block',
        draggable: false,
        parseDOM: [{ tag: 'div.charm-linked-page' }],
        toDOM: (): DOMOutputSpec => {
          return ['div', { class: 'charm-linked-page' }];
        },
        atom: true
      },
      markdown: {
        toMarkdown: (state, node) => {
          try {
            state.write(encloseNestedPage(node.attrs.id));
            state.ensureNewLine();
          } catch (err) {
            log.warn('Conversion err', err);
          }
        }
      }
    },
    suggestTooltip.spec({ markName: linkedPageSuggestMarkName }),
    // add temporary stub to support old mark name
    {
      name: 'nestedPageSuggest',
      type: 'mark',
      schema: {
        toDOM: () => ['span']
      }
    }
  ];
}
