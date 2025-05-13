import { log } from '@charmverse/core/log';
import type { DOMOutputSpec } from 'prosemirror-model';

import type { RawSpecs } from '../@bangle.dev/core/specRegistry';

export function spec() {
  return [rowSpec(), columnSpec()];
}

function rowSpec(): RawSpecs {
  return {
    type: 'node',
    name: 'columnLayout',
    schema: {
      attrs: {
        track: {
          default: []
        }
      },
      content: 'columnBlock+',
      isolating: true,
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-column-row' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-column-row' }, 0];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        /*
        An approach to generating columns would be to have a single-row markdown table.
        For this to work, we need to find a way to replace all the whitepace in the inner nodes with a <br> tag

        See MarkdownSerialiserState implementation here
        https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/to_markdown.js

        node.forEach(column => {
          // Calls serialisers for each content node
          state.renderInline(column);
        });
        */
      }
    }
  };
}

function columnSpec(): RawSpecs {
  return {
    type: 'node',
    name: 'columnBlock',
    schema: {
      attrs: {
        size: {
          default: undefined
        },
        track: {
          default: []
        }
      },
      isolating: true,
      content: 'block*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-column' }],
      toDOM: (node): DOMOutputSpec => {
        // console.log('to dom', node.attrs);
        return ['div', getColumnProperties({ size: node.attrs.size as number }), 0];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        log.warn('Column triggered but no markdown support', node);
      }
    }
  };
}

export function getColumnProperties({ size }: { size?: number }) {
  const config = JSON.stringify({
    defaultSize: size,
    minSize: 50
  });
  return { class: 'charm-column', 'data-item-type': 'SECTION', 'data-item-config': config };
}
