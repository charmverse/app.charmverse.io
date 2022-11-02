import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export function placeholderPlugin (text: string = "Type '/' for commands") {
  const update = (view: EditorView) => {
    if (view.editable) {
      if (view.state.doc.textContent) {
        view.dom.removeAttribute('data-placeholder');
      }
      else if (view.editable) {
        view.dom.setAttribute('data-placeholder', text);
      }
    }
  };

  return new Plugin({
    view (view) {
      update(view);
      return { update };
    }
  });
}
