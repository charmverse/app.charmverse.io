import { Plugin, NodeView } from '@bangle.dev/core';
import type { EditorView, Slice } from '@bangle.dev/pm';

import log from 'lib/log';
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
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
          // @ts-ignore
          const contentRow = slice.content.content?.[0]?.content.content?.[0] ?? slice.content.content?.[0];
          const text = rawEvent.clipboardData?.getData('text/plain');
          const attrs = extractAttrsFromEmbedCode(text ?? '');
          log.debug('pasted nft content', { contentRow, attrs, text });
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
