import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { checkIsContentEmpty } from './checkIsContentEmpty';

export function insertAndFocusLineAtEndofDoc(view: EditorView) {
  const { tr, schema } = view.state;
  const isLastLineEmptyParapgrah =
    view.state.doc.lastChild &&
    view.state.doc.lastChild.type.name === 'paragraph' &&
    checkIsContentEmpty(view.state.doc.lastChild.toJSON() as any);
  // console.log(checkIsContentEmpty(view.state.doc.lastChild as any), view.state.doc.lastChild.content);
  if (!isLastLineEmptyParapgrah) {
    const paragraph = schema.nodes.paragraph?.createAndFill();
    if (paragraph) {
      tr.insert(tr.doc.content.size, paragraph);
    }
  }
  view.dispatch(tr.setSelection(TextSelection.atEnd(tr.doc)));
  view.focus();
}
