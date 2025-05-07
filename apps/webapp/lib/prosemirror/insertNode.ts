import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

interface DispatchFn {
  (tr: Transaction): void;
}

export function insertNode(
  name: string,
  state: EditorState,
  dispatch: DispatchFn,
  view: EditorView,
  attrs?: { [key: string]: any }
) {
  const type = state.schema.nodes[name];
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}
