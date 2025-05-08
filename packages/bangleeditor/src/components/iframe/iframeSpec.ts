import type { Node } from 'prosemirror-model';

import { embeddedNodeSpec } from '../../specs/embeddedNodeSpec';
import type { RawSpecs } from '../@bangle.dev/core/specRegistry';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT } from './constants';

export const name = 'iframe';

export function spec(): RawSpecs {
  return embeddedNodeSpec({
    name,
    markdown: {
      toMarkdown: (state, node) => {
        // eslint-disable-next-line prefer-const
        let { height, width, src } = node.attrs;

        if (height && width && src) {
          height = parseInt(height);
          width = parseInt(width);

          const attributesToWrite = ` width=${width}px height=${height}px src=${src} `;

          const toRender = `\r\n<iframe ${attributesToWrite}></iframe>\r\n\r\n\r\n`;

          // Ensure markdown html will be separated by newlines
          state.ensureNewLine();
          state.text(toRender);
          state.ensureNewLine();
        }
      }
    },
    schema: {
      attrs: {
        src: {
          default: ''
        },
        width: {
          default: MAX_EMBED_WIDTH
        },
        height: {
          default: MIN_EMBED_HEIGHT
        },
        // Type of iframe, it could either be figma or embed
        type: {
          default: 'embed'
        },
        track: {
          default: []
        }
      },
      parseDOM: [
        {
          tag: 'iframe',
          getAttrs: (dom: any) => {
            return {
              src: dom.getAttribute('src'),
              width: dom.getAttribute('data-width'),
              height: dom.getAttribute('data-height'),
              type: dom.getAttribute('data-type')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return [
          'iframe',
          {
            class: 'ns-embed',
            'data-height': node.attrs.height,
            'data-width': node.attrs.height,
            'data-type': node.attrs.height
          }
        ];
      }
    }
  });
}
