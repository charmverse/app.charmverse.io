import { log } from '@charmverse/core/log';
import type { Node } from 'prosemirror-model';

import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';

export function extractPollIdsFromDoc(pageContent: any | null) {
  const blocks: Node[] = [];
  if (pageContent) {
    try {
      const doc = getNodeFromJson(pageContent);
      if (doc) {
        doc.descendants((node) => {
          if (node.type.name === 'poll') {
            blocks.push(node);
          }
          // return true to iterate over child of node
          return true;
        });
      }
    } catch (error) {
      log.error('Error extracting pollIds from content', { error, pageContent });
    }
  }
  return blocks.map((block) => block.attrs.pollId).filter(Boolean);
}
