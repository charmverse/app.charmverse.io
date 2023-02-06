import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Slice } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

import { extractYoutubeLinkType } from '../video/utils';
import type { VideoNodeAttrs } from '../video/videoSpec';
import { name as videoName } from '../video/videoSpec';

import { MIN_EMBED_HEIGHT } from './config';
import type { IframeNodeAttrs } from './config';
import { name } from './iframeSpec';
import { extractIframeProps, extractEmbedType } from './utils';

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'iframe',
      containerDOM: ['div', { class: 'iframe-container', draggable: 'false' }]
    }),
    new Plugin({
      props: {
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent) => {
          const event = rawEvent;
          if (!event.clipboardData) {
            return false;
          }
          const text = event.clipboardData.getData('text/plain');
          const html = event.clipboardData.getData('text/html');
          const isPlainText = text && !html;

          if (!isPlainText) {
            return false;
          }
          const props = extractIframeProps(text);
          if (props) {
            const { src, height, width } = props;
            if (extractYoutubeLinkType(src)) {
              const attrs: Partial<VideoNodeAttrs> = { src };
              insertNode(videoName, view.state, view.dispatch, view, attrs);
            } else {
              const embedType = extractEmbedType(src);
              const attrs: Partial<IframeNodeAttrs> = {
                src,
                height: height ?? MIN_EMBED_HEIGHT,
                width: width || undefined,
                type: embedType
              };
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
