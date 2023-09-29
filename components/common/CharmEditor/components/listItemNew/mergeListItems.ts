import type { Schema } from 'prosemirror-model';
import { Fragment } from 'prosemirror-model';
import type { Transaction } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';

import { nodeAtSafe } from 'lib/prosemirror/nodeAtSafe';

import { HEADING, LIST_ITEM, PARAGRAPH } from './nodeNames';

export function mergeListItemUp(tr: Transaction, schema: Schema): Transaction {
  // This merge a list item to is previous list item of the selection is at the
  // beginning of the list item.
  const { selection } = tr;
  if (!selection) {
    return tr;
  }
  const nodeType = schema.nodes[LIST_ITEM];
  if (!nodeType) {
    return tr;
  }
  const { from, empty } = selection;
  if (!empty) {
    // Selection is collapsed.
    return tr;
  }
  const result = findParentNodeOfType(nodeType)(selection);
  if (!result) {
    return tr;
  }
  const { pos, node } = result;
  if (from !== pos + 2) {
    // Selection is not at the begining of the list item.
    return tr;
  }
  const $pos = tr.doc.resolve(pos);
  const prevNode = $pos.nodeBefore;
  if (!prevNode || prevNode.type !== nodeType) {
    return tr;
  }
  if (node.childCount !== 1) {
    // list item should only have one child (paragraph).
    return tr;
  }

  const paragraphNode = node.firstChild;
  const textNode = schema.text(' ');

  // Delete the list item HERE
  tr = tr.delete(pos - 2, pos + node.nodeSize);
  // Append extra space character to its previous list item.
  tr = tr.insert(pos - 2, Fragment.from(textNode));
  // Move the content to its previous list item.
  tr = tr.insert(pos - 1, Fragment.from(paragraphNode?.content));
  tr = tr.setSelection(TextSelection.create(tr.doc, pos - 1, pos - 1));
  return tr;
}

export function mergeListItemDown(tr: Transaction, schema: Schema): Transaction {
  // This merge a list item to is next list item of the selection is at the
  // beginning of the list item.
  const { selection } = tr;
  if (!selection) {
    return tr;
  }
  const listItem = schema.nodes[LIST_ITEM];
  if (!listItem) {
    return tr;
  }
  const { from, empty } = selection;
  if (!empty) {
    // Selection is collapsed.
    return tr;
  }
  const result = findParentNodeOfType(listItem)(selection);
  if (!result) {
    return tr;
  }
  const { pos, node } = result;
  if (from !== pos + node.content.size) {
    // Selection is not at the begining of the list item.
    return tr;
  }

  const $pos = tr.doc.resolve(pos);
  const list = $pos.parent.type;
  const listResult = findParentNodeOfType(list)(selection);
  if (!listResult) {
    return tr;
  }
  const nextFrom = pos + node.nodeSize;
  let nextNode = nodeAtSafe(tr.doc, nextFrom);
  let deleteFrom = nextFrom;
  if (listResult.start + listResult.node.content.size === nextFrom) {
    // It's at the end of the last list item. It shall bring the content of the
    // block after the list.
    nextNode = nodeAtSafe(tr.doc, nextFrom + 1);
    deleteFrom += 1;
  }
  if (!nextNode) {
    return tr;
  }

  let nextContent;

  switch (nextNode.type) {
    case listItem: {
      // List item should only have one child (paragraph).
      const paragraphNode = nextNode.firstChild;
      if (!paragraphNode) {
        throw new Error('Paragraph child node not found inside of list item');
      }
      nextContent = Fragment.from(paragraphNode.content);
      break;
    }

    case schema.nodes[HEADING]:
    case schema.nodes[PARAGRAPH]:
      // Will bring in the content of the next block.
      nextContent = Fragment.from(nextNode.content);
      break;
    default:
      break;
  }

  if (!nextContent) {
    return tr;
  }

  const textNode = schema.text(' ');
  // Delete the next node.
  tr = tr.delete(deleteFrom, deleteFrom + nextNode.nodeSize);
  // Append extra space character to its previous list item.
  tr = tr.insert(nextFrom - 2, nextContent);
  // Move the content to the list item.
  tr = tr.insert(nextFrom - 2, Fragment.from(textNode));
  tr = tr.setSelection(TextSelection.create(tr.doc, nextFrom - 2, nextFrom - 2));
  return tr;
}
