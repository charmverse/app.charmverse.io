import type { Node, Schema } from 'prosemirror-model';
import { Fragment } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { BLOCKQUOTE, HEADING, LIST_ITEM, PARAGRAPH } from '../../nodeNames';
import { isAtBeginningOfLine } from '../../utils';

import { consolidateListNodes } from './consolidateListNodes';
import { isListNode } from './isListNode';
import { transformAndPreserveTextSelection } from './transformAndPreserveTextSelection';

// import { MAX_INDENT_LEVEL, MIN_INDENT_LEVEL } from './ParagraphNodeSpec';

const MIN_INDENT_LEVEL = 0;
const MAX_INDENT_LEVEL = 7;

type UpdateIntendType = {
  tr: Transaction;
  docChanged: boolean;
};

export function updateIndentLevel(
  state: EditorState,
  tr: Transaction,
  schema: Schema,
  delta: number,
  view?: EditorView
): UpdateIntendType {
  const { doc, selection } = tr as Transaction;
  if (!doc || !selection) {
    return { tr, docChanged: false };
  }

  const { nodes } = schema;
  const { from, to } = selection;
  const listNodePoses: number[] = [];
  const blockquote = nodes[BLOCKQUOTE];
  const heading = nodes[HEADING];
  const paragraph = nodes[PARAGRAPH];

  function isInsideTextNode() {
    const textNode = doc.nodeAt(from - 1);
    if (!textNode) {
      return false;
    }
    return from + textNode.nodeSize >= to;
  }

  // only toggle indent if the selection is at the beginning of the line or the entire line is selected
  if (!isAtBeginningOfLine(state) && isInsideTextNode()) {
    return { tr, docChanged: false };
  }

  doc.nodesBetween(from, to, (node, pos) => {
    const nodeType = node.type;
    if (nodeType === paragraph || nodeType === heading || nodeType === blockquote) {
      // this is handled by our tabIndent plugin
      // tr = setNodeIndentMarkup(state, tr, pos, delta, view).tr;
      return false;
    } else if (isListNode(node)) {
      // List is tricky, we'll handle it later.
      listNodePoses.push(pos);
      return false;
    }
    return true;
  });

  if (!listNodePoses.length) {
    return { tr, docChanged: false };
  }

  tr = transformAndPreserveTextSelection(tr, schema, (memo) => {
    const { schema: memoSchema } = memo;
    let tr2 = memo.tr;
    listNodePoses
      .sort(compareNumber)
      .reverse()
      .forEach((pos) => {
        tr2 = setListNodeIndent(state, tr2, memoSchema, pos, delta);
      });
    tr2 = consolidateListNodes(tr2);
    return tr2;
  });

  return { tr, docChanged: true };
}

function isEntireLine(state: EditorState, pos: number, node: Node) {
  const { from, to } = state.selection;
  // the text selection inside a list item is offset by 2, so add 2 to the start and subtract 2 from the end
  return from === pos + 2 && to === pos + node.nodeSize - 2;
}

function setListNodeIndent(
  state: EditorState,
  tr: Transaction,
  schema: Schema,
  pos: number,
  delta: number
): Transaction {
  const listItem = schema.nodes[LIST_ITEM];
  if (!listItem) {
    return tr;
  }

  const { doc, selection } = tr;
  if (!doc) {
    return tr;
  }

  const listNode = doc.nodeAt(pos);
  if (!listNode) {
    return tr;
  }

  const indentNew = clamp(MIN_INDENT_LEVEL, listNode.attrs.indent + delta, MAX_INDENT_LEVEL);

  if (indentNew === listNode.attrs.indent) {
    return tr;
  }

  const { from, to } = selection;

  // [FS] IRAD-947 2020-05-19
  // Fix for Multi-level lists lose multi-levels when indenting/de-indenting
  // Earlier they checked the to postion value to >= pos + listNode.nodeSize
  // It wont satisfy the list hve childrens

  if (from <= pos && to >= pos) {
    return setNodeIndentMarkup(state, tr, pos, delta).tr;
  }

  const listNodeType = listNode.type;

  // listNode is partially selected.
  const itemsBefore: Node[] = [];
  const itemsSelected: Node[] = [];
  const itemsAfter: Node[] = [];

  doc.nodesBetween(pos, pos + listNode.nodeSize, (itemNode, itemPos) => {
    if (itemNode.type === listNodeType) {
      return true;
    }

    if (itemNode.type === listItem) {
      const listItemNode = listItem.create(itemNode.attrs, itemNode.content, itemNode.marks);
      if (itemPos + itemNode.nodeSize <= from) {
        itemsBefore.push(listItemNode);
      } else if (itemPos > to) {
        itemsAfter.push(listItemNode);
      } else {
        itemsSelected.push(listItemNode);
      }
      return false;
    }

    return true;
  });

  tr = tr.delete(pos, pos + listNode.nodeSize);
  if (itemsAfter.length) {
    const listNodeNew = listNodeType.create(listNode.attrs, Fragment.from(itemsAfter));
    tr = tr.insert(pos, Fragment.from(listNodeNew));
  }

  if (itemsSelected.length) {
    const listNodeAttrs = {
      ...listNode.attrs,
      indent: indentNew
    };
    const listNodeNew = listNodeType.create(listNodeAttrs, Fragment.from(itemsSelected));
    tr = tr.insert(pos, Fragment.from(listNodeNew));
  }

  if (itemsBefore.length) {
    const listNodeNew = listNodeType.create(listNode.attrs, Fragment.from(itemsBefore));
    tr = tr.insert(pos, Fragment.from(listNodeNew));
  }

  return tr;
}

function setNodeIndentMarkup(
  _state: EditorState,
  tr: Transaction,
  pos: number,
  delta: number,
  _view?: EditorView
): UpdateIntendType {
  const retVal = true;
  if (!tr.doc) {
    return { tr, docChanged: false };
  }
  const node = tr.doc.nodeAt(pos);
  if (!node) {
    return { tr, docChanged: retVal };
  }
  const indent = clamp(MIN_INDENT_LEVEL, (node.attrs.indent || 0) + delta, MAX_INDENT_LEVEL);

  if (indent === node.attrs.indent) {
    return { tr, docChanged: false };
  }
  const nodeAttrs = {
    ...node.attrs,
    indent
  };
  tr = tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
  return { tr, docChanged: true };
}

function compareNumber(a: number, b: number): number {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
}

function clamp(min: number, val: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
