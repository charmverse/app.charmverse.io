import type { Command } from '@bangle.dev/pm';
import { chainCommands } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import type { Node, NodeType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

import { mergeListItemDown, mergeListItemUp } from './mergeListItems';
import { BULLET_LIST, LIST_ITEM, ORDERED_LIST } from './nodeNames';
import { splitListItem } from './splitListItem';
import { isNodeTodo, removeTodo, setTodo } from './todo';
import { toggleList } from './toggleList';
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
