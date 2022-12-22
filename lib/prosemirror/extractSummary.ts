import type { Node } from 'prosemirror-model';
import { findChildren } from 'prosemirror-utils';

import { getNodeFromJson } from './getNodeFromJson';
import type { PageContent } from './interfaces';

const summaryBlockTypes = ['image', 'tweet', 'video'];
const textParagrahLimit = 3;

// extract the first interesting node of a post
export function extractSummary(doc: PageContent): PageContent | null {
  const node = getNodeFromJson(doc);
  const nodes = extractBlockSummary(node) || extractTextSummary(node);
  return createJSON(nodes);
}

function extractBlockSummary(doc: Node): Node | null {
  const children = findChildren(
    doc,
    (_node) => {
      return summaryBlockTypes.includes(_node.type.name);
    },
    true
  );
  if (children.length > 0) {
    return children[0].node;
  }
  return null;
}

function extractTextSummary(doc: Node): Node[] {
  const children: Node[] = [];
  doc.descendants((node, pos) => {
    if (children.length < textParagrahLimit) {
      children.push(node);
    }
    return false;
  });
  const textNodes: Node[] = [];
  for (let i = 0; i < children.length; i++) {
    if (children[i].isTextblock) {
      textNodes.push(children[i]);
    } else {
      break;
    }
  }
  return textNodes;
}

function createJSON(node: Node[] | Node): PageContent | null {
  const nodes = Array.isArray(node) ? node : [node];
  return nodes[0].type.schema.node('doc', null, nodes).toJSON();
}
