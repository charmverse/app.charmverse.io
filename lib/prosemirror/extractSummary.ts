import { findChildren } from 'prosemirror-utils';

import { getNodeFromJson } from './getNodeFromJson';
import type { PageContent } from './interfaces';

const summaryBlockTypes = ['image', 'tweet'];

export function extractSummaryNode(doc: PageContent): PageContent | null {
  const node = getNodeFromJson(doc);
  // console.log('node', node);
  const firstChild = node.firstChild;
  if (!firstChild) {
    // no content
    return null;
  }
  // Step 1 - determine if the first node is interesting
  const children = findChildren(firstChild, (_node) => summaryBlockTypes.includes(_node.type.name));
  // console.log('children', children);
  // get the first paragraph node
  return node.toJSON();
}
