import type { DOMOutputSpec } from '@bangle.dev/pm';
import { log } from '@charmverse/core/log';

import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import { nestedPageNodeName } from './nestedPage.constants';
import { encloseNestedPage } from './nestedPage.utils';

export function nestedPageSpec(): RawSpecs {
  return [
    {
      type: 'node',
      name: nestedPageNodeName,
      schema: {
        inline: false,
        attrs: {
          // This property is used to reference the page
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
        parseDOM: [{ tag: 'div.charm-nested-page' }],
        toDOM: (): DOMOutputSpec => {
          return ['div', { class: 'charm-nested-page' }];
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
    }
  ];
}
