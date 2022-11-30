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

// utils
export function extractYoutubeLinkType(url: string) {
  if (url.includes('https://www.youtube.com/embed')) {
    return 'youtube_embed_link';
  } else if (url.includes('youtube.com')) {
    return 'youtube_link';
  } else if (url.includes('youtu.be')) {
    return 'youtube_shared_link';
  }
  return null;
}

export function extractYoutubeEmbedLink(url: string): string | null {
  const linkType = extractYoutubeLinkType(url);

  let embedUrl: string | null = null;
  if (linkType) {
    const { pathname, search } = new URL(url);
    const urlSearchParams = new URLSearchParams(search);
    if (linkType === 'youtube_link') {
      embedUrl = `https://www.youtube.com/embed/${urlSearchParams.get('v')}`;
    } else if (linkType === 'youtube_shared_link') {
      embedUrl = `https://www.youtube.com/embed${pathname}`;
    }
    // embed link
    else {
      embedUrl = url;
    }
    if (urlSearchParams.has('t')) {
      embedUrl += `?start=${urlSearchParams.get('t')}`;
    }
  }
  return embedUrl;
}
