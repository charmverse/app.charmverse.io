import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';

import { key as caretsKey } from '../fiduswriter/state_plugins/collab_carets';

// source: https://gist.github.com/amk221/1f9657e92e003a3725aaa4cf86a07cc0
// see also: https://discuss.prosemirror.net/t/how-to-input-like-placeholder-behavior/705/24
export function placeholderPlugin (text: string = "Type '/' for commands") {
  const update = (view: EditorView) => {
    if (view.editable) {
      const doc = view.state.doc;
      const hasContent = !checkIsContentEmpty(doc.toJSON() as any);
      const collabCaret = caretsKey.getState(view.state);
      const hasOtherUserCarets = collabCaret && collabCaret.caretPositions.length > 0;
      if (hasContent || hasOtherUserCarets) {
        view.dom.removeAttribute('data-placeholder');
      }
      else {
        view.dom.setAttribute('data-placeholder', text);
      }
    }
  };

  return new Plugin({
    view (_view) {
      update(_view);
      return { update };
    }
  });
}
