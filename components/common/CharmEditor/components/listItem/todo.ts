import { filter } from '@bangle.dev/utils';
import { InputRule } from 'prosemirror-inputrules';
import type { Node, Schema } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { canJoin, findWrapping } from 'prosemirror-transform';

export const isNodeTodo = (node: Node, schema: Schema) => {
  return node.type === schema.nodes.listItem && typeof node.attrs.todoChecked === 'boolean';
};

/**
 * remove todoChecked attribute from a listItem
 * no-op if not listitem
 * @param {*} tr
 * @param {*} schema
 * @param {*} node
 * @param {*} pos
 */
export const removeTodoCheckedAttr = (tr: Transaction, schema: Schema, node: Node, pos: number) => {
  if (isNodeTodo(node, schema)) {
    tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, todoChecked: null });
  }
  return tr;
};

/**
 * set todoChecked attribute to a listItem
 * no-op if not listitem or if already todo
 * @param {*} tr
 * @param {*} schema
 * @param {*} node
 * @param {*} pos
 */
export const setTodoCheckedAttr = (tr: Transaction, schema: Schema, node: Node, pos: number) => {
  if (node.type === schema.nodes.listItem && !isNodeTodo(node, schema)) {
    tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, todoChecked: false });
  }
  return tr;
};

/**
 * A command to remove the todoChecked attribute (if any) to nodes in and around of the
 * selection. Uses the rules of siblingsAndNodesBetween to shortlist the nodes.
 * If no nodes with todoChecked attr are found returns false otherwise true
 */
export const removeTodo = filter(
  [isSelectionParentBulletList, (state) => todoCount(state).todos !== 0],
  (state, dispatch) => {
    const { schema } = state;
    let tr = state.tr;
    siblingsAndNodesBetween(state, (node, pos) => {
      tr = removeTodoCheckedAttr(tr, schema, node, pos);
    });

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  }
);

/**
 * A command to set the todoChecked attribute to nodes in and around of the
 * selection. Uses the rules of siblingsAndNodesBetween to shortlist the nodes.
 * If all nodes are already having todoChecked attr returns false otherwise true
 */
export const setTodo = filter(
  [
    isSelectionParentBulletList,
    (state) => {
      const { todos, lists } = todoCount(state);
      // If all the list items are todo or none of them are todo
      // return false so we can run the vanilla toggleList
      return todos !== lists;
    }
  ],
  (state, dispatch) => {
    let { tr } = state;
    const { schema } = state;

    siblingsAndNodesBetween(state, (node, pos) => {
      tr = setTodoCheckedAttr(tr, schema, node, pos);
    });

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  }
);

// Alteration of PM's wrappingInputRule
export function wrappingInputRuleForTodo(
  regexp: RegExp,
  getAttrs: Node['attrs'] | ((match: RegExpMatchArray) => Node['attrs'])
) {
  return new InputRule(regexp, (state, match, start, end) => {
    const nodeType = state.schema.nodes.listItem;
    const attrs = getAttrs instanceof Function ? getAttrs(match as RegExpMatchArray) : getAttrs;
    const tr = state.tr.delete(start, end);
    const $start = tr.doc.resolve(start);
    const range = $start.blockRange();
    const wrapping = range && findWrapping(range, nodeType, attrs);
    if (!wrapping) {
      return null;
    }
    tr.wrap(range!, wrapping);
    const before = tr.doc.resolve(start - 1).nodeBefore;
    if (
      before &&
      before.type === state.schema.nodes.bulletList &&
      canJoin(tr.doc, start - 1) &&
      before.lastChild &&
      // only join if before is todo
      isNodeTodo(before.lastChild, state.schema)
    ) {
      tr.join(start - 1);
    }
    return tr;
  });
}

/**
 * given a bullet/ordered list it will call callback for each node
 *  which
 *    - strictly lies inside the range provided
 *    - nodes that are sibblings of the top level nodes
 *      which lie in the range.
 *
 * Example
 *         <ul>
 *              <li>[A
 *                 <list-A's kids/>
 *              </li>
 *              <li><B]></li>
 *              <li><C></li>
 *              <li>D <list-D's kids </li>
 *           </ul>
 *
 * In the above the callback will be called for everyone
 *  A, list-A's kids, B, C, D _but_ not list-D's kids.
 */
export function siblingsAndNodesBetween(state: EditorState, callback: (node: Node, pos: number) => void) {
  const {
    schema,
    selection: { $from, $to }
  } = state;
  const range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild!.type === schema.nodes.listItem);

  if (!range) {
    return;
  }

  const { parent, startIndex, endIndex } = range;

  // NOTE: this gets us to start pos inside of the parent bullet list
  //        <ul>{} <nth-item> ..[.]. </nth-item></ul>
  //        {} - is the pos of offset
  let startPos = range.$from.start(range.depth);

  for (let i = 0; i < parent.childCount; i++) {
    const child = parent.child(i);

    callback(child, startPos);

    // also call callback for children of nodes
    // that lie inside the selection
    if (i >= startIndex && i < endIndex - 1) {
      child.nodesBetween(0, child.content.size, callback, startPos + 1);
    }

    startPos += child.nodeSize;
  }
}

function isSelectionParentBulletList(state: EditorState) {
  const { selection } = state;
  const fromNode = selection.$from.node(-2);
  const endNode = selection.$to.node(-2);

  return (
    fromNode &&
    fromNode.type === state.schema.nodes.bulletList &&
    endNode &&
    endNode.type === state.schema.nodes.bulletList
  );
}

function todoCount(state: EditorState) {
  let lists = 0;
  let todos = 0;

  const { schema } = state;
  siblingsAndNodesBetween(state, (node) => {
    // TODO it might create problem by counting ol 's listItem?
    if (node.type === schema.nodes.listItem) {
      lists += 1;
    }

    if (isNodeTodo(node, schema)) {
      todos += 1;
    }
  });

  return {
    lists,
    todos
  };
}
