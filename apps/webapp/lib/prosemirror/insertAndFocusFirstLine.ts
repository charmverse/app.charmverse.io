import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export function insertAndFocusFirstLine(view: EditorView) {
  const { tr, schema } = view.state;

  // create text node at the beginning of the document
  const paragraph = schema.nodes.paragraph?.create();
  tr.insert(0, paragraph);

  // select the first line and focus
  view.dispatch(tr.setSelection(TextSelection.atStart(tr.doc)));
  view.focus();
}
