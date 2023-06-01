import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';

const defaultPlaceholderText = "Type '/' for commands";

// source: https://gist.github.com/amk221/1f9657e92e003a3725aaa4cf86a07cc0
// see also: https://discuss.prosemirror.net/t/how-to-input-like-placeholder-behavior/705/24
export function placeholderPlugin(text: string = defaultPlaceholderText) {
  const update = (view: EditorView) => {
    const doc = view.state.doc;

    // Allow showing a placeholder (often used for permissions) but avoid showing the default edit-focused placeholder when editor is readonly
    if (view.editable || (!view.editable && text !== defaultPlaceholderText)) {
      const hasContent = !checkIsContentEmpty(doc.toJSON() as any);
      if (hasContent) {
        view.dom.removeAttribute('data-placeholder');
      } else {
        view.dom.setAttribute('data-placeholder', text);
      }
    }
  };

  return new Plugin({
    view(_view) {
      update(_view);
      return { update };
    }
  });
}
