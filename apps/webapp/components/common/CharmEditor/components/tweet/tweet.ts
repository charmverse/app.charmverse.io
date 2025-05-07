import type { Slice } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
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
