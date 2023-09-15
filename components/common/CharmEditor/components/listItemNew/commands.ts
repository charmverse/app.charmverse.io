import type { Command, NodeType } from '@bangle.dev/pm';

import { splitListItem } from './splitListItem';
import { updateIndentLevel } from './updateIndentLevel';

// Chaining runs each command until one of them returns true
export const splitListCommand =
  (type?: NodeType): Command =>
  (state, dispatch, view) => {
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
