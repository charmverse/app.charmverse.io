import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Slice } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

import { name } from './nftSpec';
import { extractAttrsFromEmbedCode } from './nftUtils';

// inject a tweet node when pasting twitter url

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['nft-embed']
    }),
    new Plugin({
      props: {
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
          // @ts-ignore
          const contentRow = slice.content.content?.[0]?.content.content?.[0] ?? slice.content.content?.[0];
          const attrs = extractAttrsFromEmbedCode(contentRow?.text);
          if (attrs) {
            insertNode(name, view.state, view.dispatch, view, attrs);
            return true;
          }
          return false;
        }
      }
    })
  ];
}
