import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

// source: https://gist.github.com/amk221/1f9657e92e003a3725aaa4cf86a07cc0
// see also: https://discuss.prosemirror.net/t/how-to-input-like-placeholder-behavior/705/24
export function placeholderPlugin (text: string = "Type '/' for commands") {
  const update = (view: EditorView) => {
    if (view.editable) {
      const doc = view.state.doc;
      const isEmpty = doc.childCount === 1
        && doc.firstChild?.isTextblock
        && doc.firstChild?.content.size === 0;
      if (!isEmpty) {
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
