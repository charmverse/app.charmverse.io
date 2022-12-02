import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Slice } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

import { extractYoutubeLinkType } from '../video/utils';
import type { VideoNodeAttrs } from '../video/videoSpec';
import { name as videoName } from '../video/videoSpec';

import type { IframeNodeAttrs } from './config';
import { name } from './iframeSpec';
import { extractUrlFromIFrame, extractEmbedType } from './utils';

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
          // @ts-ignore
          const contentRow = slice.content.content?.[0]?.content.content || [];
          // @ts-ignore
          const nodesWithUrl = contentRow.map((node) => extractUrlFromIFrame(node.text)).filter(Boolean);
          const iframeUrl = nodesWithUrl[0];
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
