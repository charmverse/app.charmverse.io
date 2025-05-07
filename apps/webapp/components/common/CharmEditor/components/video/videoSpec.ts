import type { Node } from 'prosemirror-model';

import { embeddedNodeSpec } from '../../specs/embeddedNodeSpec';
import type { RawSpecs } from '../@bangle.dev/core/specRegistry';
import { MAX_EMBED_WIDTH } from '../iframe/constants';

export const name = 'video';

export const VIDEO_ASPECT_RATIO = 1.77;

export type VideoNodeAttrs = {
  src?: string;
  muxAssetId?: string; // we may not need this, but it's used to get the status while video is being processed
  muxPlaybackId?: string; // this is the id we need to embed the video
  width: number;
};

export function spec(): RawSpecs {
  return embeddedNodeSpec({
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { muxPlaybackId, src } = node.attrs as VideoNodeAttrs;
        let toRender = '';
        if (muxPlaybackId) {
          toRender = `Embedded Private Video: https://stream.mux.com/${muxPlaybackId}`;
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
        muxAssetId: {
          default: ''
        },
        muxPlaybackId: {
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
      draggable: true,
      parseDOM: [
        {
          tag: 'charm-video',
          getAttrs: (dom: any): VideoNodeAttrs => {
            return {
              src: dom.getAttribute('video-src'),
              muxAssetId: dom.getAttribute('video-mux-asset-id'),
              muxPlaybackId: dom.getAttribute('video-mux-id'),
              width: dom.getAttribute('video-width')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return [
          'charm-video',
          {
            'video-src': node.attrs.src,
            'video-mux-asset-id': node.attrs.muxAssetId,
            'video-mux-id': node.attrs.muxPlaybackId,
            'video-width': node.attrs.width
          }
        ];
      }
    }
  });
}
