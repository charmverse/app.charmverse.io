import type { RawSpecs } from '@bangle.dev/core';
import type { Node } from '@bangle.dev/pm';

import { MAX_EMBED_WIDTH } from 'lib/embed/constants';

import { embeddedNodeSpec } from '../../specs/embeddedNodeSpec';

const name = 'video';

export const VIDEO_ASPECT_RATIO = 1.77;

export type VideoNodeAttrs = {
  src?: string;
  muxId?: string;
  width: number;
};

export function spec(): RawSpecs {
  return embeddedNodeSpec({
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { muxId, src } = node.attrs as VideoNodeAttrs;
        let toRender = '';
        if (muxId) {
          toRender = `Embedded Private Video: https://stream.mux.com/${muxId}`;
        } else if (src) {
          toRender = `Embedded Video: ${src}`;
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
        src: {
          default: ''
        },
        muxId: {
          default: ''
        },
        width: {
          default: MAX_EMBED_WIDTH
        },
        height: {
          default: MAX_EMBED_WIDTH / VIDEO_ASPECT_RATIO
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
              src: dom.getAttribute('video-src'),
              muxId: dom.getAttribute('video-mux-id'),
              width: dom.getAttribute('video-width')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return [
          'charm-video',
          { 'video-src': node.attrs.src, 'video-mux-id': node.attrs.muxId, 'video-width': node.attrs.width }
        ];
      }
    }
  });
}
