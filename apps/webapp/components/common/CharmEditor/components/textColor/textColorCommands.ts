import type { EditorState, Transaction } from 'prosemirror-state';
import type {} from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';

import { applyMark } from './applyMark';
import type { TextColorAttrs } from './config';
import { markName } from './config';

export function executeWithUserInput(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView,
  color?: TextColorAttrs
): boolean {
  if (dispatch && color !== undefined) {
    const { schema } = state;
    let { tr } = state;
    const markType = schema.marks[markName];
    tr = applyMark(tr.setSelection(state.selection), markType, color);
    if (tr.docChanged || tr.storedMarksSet) {
      // If selection is empty, the color is added to `storedMarks`, which
      // works like `toggleMark`
      // (see https://prosemirror.net/docs/ref/#commands.toggleMark).
      dispatch(tr);
      return true;
    }
  }
  return false;
}
