import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView } from '@bangle.dev/pm';

import { insertNode } from 'lib/prosemirror/insertNode';

import { name } from './config';
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
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent) => {
          const text = rawEvent.clipboardData?.getData('text/plain');
          const attrs = extractAttrsFromEmbedCode(text ?? '');
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
