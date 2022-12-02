import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Slice } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

import { extractYoutubeLinkType } from '../video/utils';
import type { VideoNodeAttrs } from '../video/videoSpec';
import { name as videoName } from '../video/videoSpec';

import type { IframeNodeAttrs } from './config';
import { name } from './iframeSpec';
import { extractIframeUrl, extractEmbedType } from './utils';

// inject a tweet node when pasting twitter url

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'iframe',
      containerDOM: ['div', { class: 'iframe-container', draggable: 'false' }]
    }),
    new Plugin({
      props: {
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
          const iframeUrl = extractIframeUrl(slice);
          if (iframeUrl) {
            const youtubeType = extractYoutubeLinkType(iframeUrl);
            if (youtubeType) {
              const attrs: Partial<VideoNodeAttrs> = { src: iframeUrl };
              insertNode(videoName, view.state, view.dispatch, view, attrs);
            } else {
              const embedType = extractEmbedType(iframeUrl);
              const attrs: Partial<IframeNodeAttrs> = { src: iframeUrl, type: embedType };
              insertNode(name, view.state, view.dispatch, view, attrs);
            }
            return true;
          }
          return false;
        }
      }
    })
  ];
}
