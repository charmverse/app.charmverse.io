import type { EditorState } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';

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
    props: {
      // use decorations to add a placeholder when the current line is empty
      decorations: (state) => {
        const hasContent = !checkIsContentEmpty(state.doc.toJSON() as any);

        // ignore placeholder if there is no doc content
        if (!hasContent) {
          return null;
        }
        // add to empty paragraph nodes, we can skip checkIsContentEmpty() since it's a little slower
        const selectedNode = state.selection.$from.parent;
        const isEmptyParagraph = selectedNode.childCount === 0 && selectedNode.type.name === 'paragraph';
        if (isEmptyParagraph) {
          const shouldShow = shouldShowPlaceholder(state);
          if (shouldShow) {
            const resolved = state.doc.resolve(state.selection.from);
            return DecorationSet.create(state.doc, [
              Decoration.node(resolved.before(), resolved.after(), {
                class: 'charm-placeholder',
                'data-placeholder': text
              })
            ]);
          }
        }
        return null;
      }
    },
    view(_view) {
      update(_view);
      return { update };
    }
  });
}

const parentNodesToShow = ['columnBlock', 'listItem', 'list_item'];

function shouldShowPlaceholder(state: EditorState) {
  const selectionStart = state.selection.$from;
  const depth = selectionStart.depth;
  if (depth <= 1) {
    return true;
  }

  const parentNode = selectionStart.node(depth - 1);
  return parentNodesToShow.includes(parentNode.type.name);
}
