import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Slice } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

import { name, extractTweetAttrs } from './tweetSpec';

// inject a tweet node when pasting twitter url

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['tweet-embed']
    }),
    new Plugin({
      props: {
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
          // @ts-ignore
          const contentRow = slice.content.content?.[0]?.content.content;
          const tweetParams = extractTweetAttrs(contentRow?.[0]?.text);
          if (tweetParams) {
            insertNode(name, view.state, view.dispatch, view, tweetParams);
            return true;
          }
          return false;
        }
      }
    })
  ];
}
