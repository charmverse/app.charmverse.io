// Reference: https://github.com/atlassian/prosemirror-utils/blob/fbdf888a4c24bae5f124d166bd21692d7b5285be/src/transforms.ts#L168

import { isEmptyParagraph } from '@bangle.dev/utils';
import type { ResolvedPos, Node } from 'prosemirror-model';
import { Fragment } from 'prosemirror-model';
import { NodeSelection, type Transaction } from 'prosemirror-state';
import { isNodeSelection, replaceParentNodeOfType, setTextSelection } from 'prosemirror-utils';

function cloneTr(tr: Transaction) {
  return Object.assign(Object.create(tr), tr).setTime(Date.now());
}

function shouldSelectNode(node: Node) {
  return isSelectableNode(node) && node.type.isLeaf;
}

function setSelection(node: Node, pos: number, tr: Transaction) {
  if (shouldSelectNode(node)) {
    return tr.setSelection(new NodeSelection(tr.doc.resolve(pos)));
  }
  return setTextSelection(pos)(tr);
}

function isSelectableNode(node: Node) {
  return node.type && node.type.spec.selectable;
}

function canInsert($pos: ResolvedPos, content: Node | Fragment) {
  const index = $pos.index();
  if (content instanceof Fragment) {
    return $pos.parent.canReplace(index, index, content);
  }
  return $pos.parent.canReplaceWith(index, index, content.type);
}

export const safeInsert = (content: Node, position: number) => (tr: Transaction) => {
  const hasPosition = typeof position === 'number';
  const $from = tr.selection.$from;
  const $insertPos = hasPosition
    ? tr.doc.resolve(position)
    : isNodeSelection(tr.selection)
    ? tr.doc.resolve($from.pos + 1)
    : $from;
  const parent = $insertPos.parent;

  if (isEmptyParagraph(parent)) {
    const oldTr = tr;
    tr = replaceParentNodeOfType(parent.type, content)(tr);
    if (oldTr !== tr) {
      const pos = isSelectableNode(content) ? $insertPos.before($insertPos.depth) : $insertPos.pos;
      return setSelection(content, pos, tr);
    }
  }

  if (canInsert($insertPos, content)) {
    tr.insert($insertPos.pos, content);
    const pos = hasPosition
      ? $insertPos.pos
      : isSelectableNode(content)
      ? tr.selection.$anchor.pos - 1
      : tr.selection.$anchor.pos;
    return cloneTr(setSelection(content, pos, tr));
  }

  for (let i = $insertPos.depth; i > 0; i--) {
    const pos = $insertPos.after(i);
    const $pos = tr.doc.resolve(pos);
    if (canInsert($pos, content)) {
      tr.insert(pos, content);
      return cloneTr(setSelection(content, pos, tr));
    }
  }
  return tr;
};
