import type { Node } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export function setSelectionNear(view: EditorView, pos: number) {
  const tr = view.state.tr;
  view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
}

export function expectNodesAreEqual(a: Node, b: Node) {
  expect(a.toString()).toEqual(b.toString());
}
