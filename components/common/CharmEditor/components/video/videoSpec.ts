import type { RawSpecs } from '@bangle.dev/core';
import type { Node } from '@bangle.dev/pm';

import { MAX_EMBED_WIDTH } from 'lib/embed/constants';

import { embeddedNodeSpec } from '../../specs/embeddedNodeSpec';

const name = 'video';

export type VideoNodeAttrs = {
  url?: string;
  muxId?: string;
  width: number;
};

export function spec(): RawSpecs {
  return embeddedNodeSpec({
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { muxId, url } = node.attrs as VideoNodeAttrs;
        let toRender = '';
        if (muxId) {
          toRender = `Embedded Private Video: https://stream.mux.com/${muxId}`;
        } else if (url) {
          toRender = `Embedded Video: ${url}`;
        }
        if (toRender) {
          // Ensure markdown html will be separated by newlines
          state.ensureNewLine();
          state.text(toRender);
          state.ensureNewLine();
        }
      }
    },
    schema: {
      attrs: {
        url: {
          default: ''
        },
        muxId: {
          default: ''
        },
        width: {
          default: MAX_EMBED_WIDTH
        },
        track: {
          default: []
        }
      },
      parseDOM: [
        {
          tag: 'charm-video',
          getAttrs: (dom: any): VideoNodeAttrs => {
            return {
              url: dom.getAttribute('video-url'),
              muxId: dom.getAttribute('video-mux-id'),
              width: dom.getAttribute('video-width')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return [
          'charm-video',
          { 'video-url': node.attrs.url, 'video-mux-id': node.attrs.muxId, 'video-width': node.attrs.width }
        ];
      }
    }
  });
}
