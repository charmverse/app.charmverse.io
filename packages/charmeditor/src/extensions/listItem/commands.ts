import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { chainCommands } from 'prosemirror-commands';
import type { Node, NodeType } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';

import { BULLET_LIST, LIST_ITEM, ORDERED_LIST } from '../../nodeNames';
import { filter, isEmptySelectionAtStart } from '../../utils';

import { mergeListItemDown, mergeListItemUp } from './mergeListItems';
import { splitListItem } from './splitListItem';
import { isNodeTodo, removeTodo, setTodo } from './todo';
import { canToJoinToPreviousListItem, joinToPreviousListItem, toggleList, liftListItems } from './toggleList';
import { updateIndentLevel } from './updateIndentLevel';

export const splitListCommand = (): Command => (state, dispatch) => {
  const { selection, schema } = state;
  const tr = splitListItem(state.tr.setSelection(selection), schema);
  if (tr.docChanged) {
    dispatch?.(tr);
    return true;
  } else {
    return false;
  }
};

export const indentCommand =
  (delta: number): Command =>
  (state, dispatch, view) => {
    const { selection, schema } = state;
    let { tr } = state;
    tr = tr.setSelection(selection);
    const trx = updateIndentLevel(state, tr, schema, delta, view);
    if (trx.docChanged) {
      dispatch?.(trx.tr);
      return true;
    } else {
      return false;
    }
  };

export const listItemMergeCommand =
  (direction: 'up' | 'down'): Command =>
  (state, dispatch) => {
    const { selection, schema } = state;
    let { tr } = state;
    if (direction === 'down') {
      tr = mergeListItemDown(tr.setSelection(selection), schema);
    } else if (direction === 'up') {
      tr = mergeListItemUp(tr.setSelection(selection), schema);
    }

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    } else {
      return false;
    }
  };

export function updateNodeAttrs(type: NodeType, cb: (attrs: Node['attrs']) => Node['attrs']): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    const current = $from.node(-1);
    if (current && current.type === type) {
      const { tr } = state;
      const nodePos = $from.before(-1);
      const newAttrs = cb(current.attrs);
      if (newAttrs !== current.attrs) {
        tr.setNodeMarkup(nodePos, undefined, cb(current.attrs));
        if (dispatch) {
          dispatch(tr);
        }
        return true;
      }
    }
    return false;
  };
}

export function toggleBulletList(): Command {
  const handleBulletLists: Command = (state, dispatch, view) =>
    toggleList(state.schema.nodes[BULLET_LIST], state.schema.nodes[LIST_ITEM])(state, dispatch, view);

  return chainCommands(removeTodo, handleBulletLists);
}

// Chaining runs each command until one of them returns true
export const backspaceKeyCommand =
  (type: NodeType): Command =>
  (state, dispatch, view) => {
    return chainCommands(
      // if we're at the start of a list item, we need to either backspace
      // directly to an empty list item above, or outdent this node
      removeList(),

      // if we're just inside a paragraph node (or gapcursor is shown) and backspace, then try to join
      // the text to the previous list item, if one exists
      filter([isEmptySelectionAtStart, canToJoinToPreviousListItem], joinToPreviousListItem(type))
    )(state, dispatch, view);
  };

export const enterKeyCommand = (): Command => (state, dispatch, view) => {
  const selectedNode = state.selection.$from.parent;
  const isEmptyParagraph = selectedNode.childCount === 0 && selectedNode.type.name === 'paragraph';
  const selectionStart = state.selection.$from;
  const depth = selectionStart.depth;

  // If row is empty, outdent the list item
  if (isEmptyParagraph && depth > 2) {
    const parentNode = selectionStart.node(depth - 1);
    const listNode = selectionStart.node(depth - 2);
    const isListItem = parentNode.type.name === 'list_item';
    if (isListItem && isEmptyParagraph && listNode.attrs.indent > 0) {
      return indentCommand(-1)(state, dispatch, view);
    }
  }
  return splitListCommand()(state, dispatch, view);
};

export function removeList(): Command {
  return (state: EditorState, dispatch) => {
    const { schema, selection } = state;
    const listItem = schema.nodes[LIST_ITEM];
    if (!listItem) {
      return false;
    }
    const { from, empty } = selection;
    if (!empty) {
      // Selection is collapsed.
      return false;
    }
    const result = findParentNodeOfType(listItem)(selection);
    if (!result) {
      return false;
    }
    const { pos, node } = result;
    if (from !== pos + 2) {
      // Selection is not at the beginning of the list item.
      return false;
    }
    if (node.childCount !== 1) {
      // list item should only have one child (paragraph).
      return false;
    }

    if (result.node.type.name === LIST_ITEM) {
      const grandParent = state.selection.$from.node(-2);
      liftListItems(grandParent.attrs.indent)(state, dispatch);
      return true;
    }
    return false;
  };
}

export function toggleTodoList(): Command {
  const fallback: Command = (state, dispatch, view) =>
    toggleList(state.schema.nodes[BULLET_LIST], state.schema.nodes[LIST_ITEM], true)(state, dispatch, view);

  return chainCommands(setTodo, fallback);
}

export function queryIsBulletListActive() {
  return (state: EditorState) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes[LIST_ITEM], [schema.nodes[BULLET_LIST]])(state);
  };
}

export function queryIsTodoListActive() {
  return (state: EditorState) => {
    const { schema } = state;

    return (
      parentHasDirectParentOfType(schema.nodes[LIST_ITEM], [schema.nodes[BULLET_LIST]])(state) &&
      isNodeTodo(state.selection.$from.node(-1), schema)
    );
  };
}

export function toggleOrderedList(): Command {
  return (state, dispatch, view) => {
    return toggleList(state.schema.nodes[ORDERED_LIST], state.schema.nodes[LIST_ITEM])(state, dispatch, view);
  };
}

export function queryIsOrderedListActive() {
  return (state: EditorState) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes[LIST_ITEM], [schema.nodes[ORDERED_LIST]])(state);
  };
}
