import type { Command, NodeType } from '@bangle.dev/pm';

import { mergeListItemDown, mergeListItemUp } from './mergeListItems';
import { splitListItem } from './splitListItem';
import { updateIndentLevel } from './updateIndentLevel';

export const splitListCommand = (): Command => (state, dispatch, view) => {
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
