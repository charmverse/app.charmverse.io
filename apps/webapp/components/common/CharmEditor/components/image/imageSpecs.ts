import type { Node } from 'prosemirror-model';

import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/prosemirror/plugins/image/constants';

import type { RawSpecs } from '../@bangle.dev/core/specRegistry';
import { spec as suggestTooltipSpec } from '../@bangle.dev/tooltip/suggestTooltipSpec';

function imageSpec(): RawSpecs {
  return {
    type: 'node',
    name: 'image',
    schema: {
      inline: false,
      attrs: {
        caption: {
          default: null
        },
        src: {
          default: null
        },
        alt: {
          default: null
        },
        size: {
          // Making sure default size is middle of max and min range
          default: (MIN_IMAGE_WIDTH + MAX_IMAGE_WIDTH) / 2
        },
        track: {
          default: []
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs: (dom: any) => ({
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt')
          })
        }
      ] as any,
      toDOM: ((node: Node) => {
        return ['img', node.attrs];
      }) as any
    },
    markdown: {
      toMarkdown: (state, node) => {
        const { src } = node.attrs;

        if (src) {
          const toWrite = `[](${src})`;
          state.text(toWrite, false);
          state.ensureNewLine();
        }
      }
    }
  };
}

export function spec() {
  // this is a dummy marker to let us know to show the image selector
  const tooltipSpec = suggestTooltipSpec({ markName: 'tooltip-marker', trigger: 'image', excludes: '_' });
  tooltipSpec.schema.inclusive = false;
  return [tooltipSpec, imageSpec()];
}
