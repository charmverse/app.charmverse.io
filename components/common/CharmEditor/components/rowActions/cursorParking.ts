import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

/**
 *
 * Fix for cursor disappearing on FIrefox after drag an drop
 * Github issue: https://github.com/ProseMirror/prosemirror/issues/583
 *
 * Code Source: https://discuss.prosemirror.net/t/cursor-parking-a-tool-to-help-handle-native-browser-issues/2107
 *
 * In our old editor, we had a number of issues where if you prevented default, the browser would get confused.
 * The basic example is if you are in a list and you hit enter to create a new list item.
 * On iOS, the browser would “think” that you were still typing with the previous list item.
 * This would lead to issues with predictive text, auto capitalization, spellcheck, and typing in Korean.
 *
 * We asked ourself “is there some way we can get this working without preventing default?”
 * So what we did was create a temporary container, move the native selection to that container,
 * let the browser trash that container if it desires, then move the cursor back after the input event
 * fires and clean up the container. This allowed us to let the default event propagate but in a sandbox
 * that was hidden from the user. This then allowed iOS to think that a paragraph was inserted and then
 * update its internal state.
 *
 * In migrating to Prosemirror, we adapted the “cursor parking” solution and added it to a plugin.
 * With this plugin, you can dispatch a meta transaction with isCursorParking set to true to move
 * the selection to cursor parking and then dispatch a meta transaction with isCursorParking set to false
 * to restore the previous selection. This is still a work in progress but it looks like this
 */

export const pluginKey = new PluginKey('cursor-parking');

export function cursorParkingPlugin() {
  return new Plugin<any>({
    key: pluginKey,
    state: {
      init() {
        return {
          viewInFocus: false, // keep track of wether editor is actually in focus
          inCursorParking: false,
          storedMarks: null,
          bookmarkToRestore: null
        };
      },
      apply(tr, prevState) {
        const meta = tr.getMeta(pluginKey);
        const viewInFocus = typeof meta?.viewInFocus === 'boolean' ? meta.viewInFocus : prevState.viewInFocus;
        if (meta) {
          if (meta.inCursorParking) {
            return {
              viewInFocus,
              inCursorParking: true,
              storedMarks: tr.storedMarks,
              bookmarkToRestore: tr.selection.getBookmark()
            };
          } else {
            return {
              viewInFocus,
              inCursorParking: false,
              storedMarks: null,
              bookmarkToRestore: null
            };
          }
        }
        if (tr.docChanged && prevState.inCursorParking && prevState.bookmarkToRestore) {
          return {
            viewInFocus,
            inCursorParking: true,
            storedMarks: prevState.storedMarks,
            bookmarkToRestore: prevState.bookmarkToRestore.map(tr.mapping)
          };
        }
        return prevState;
      }
    },
    props: {
      handleDOMEvents: {
        blur: (view) => {
          view.dispatch(view.state.tr.setMeta(pluginKey, { viewInFocus: false }));
          return false;
        },
        focus: (view) => {
          view.dispatch(view.state.tr.setMeta(pluginKey, { viewInFocus: true }));
          return false;
        }
      }
    },
    view() {
      const cursorParking = document.createElement('cursor-parking');
      cursorParking.setAttribute('style', 'width:1px;height:1px;top:-9999px;left:-9999px;position:absolute');
      cursorParking.setAttribute('tabIndex', '-1');
      cursorParking.setAttribute('contenteditable', 'true');

      const selectCursorParkingContent = () => {
        const range = document.createRange();
        range.selectNodeContents(cursorParking.firstChild!);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      };
      const reinitializeCursorParkingContent = () => {
        cursorParking.innerHTML = '<div><br/></div>';
      };
      reinitializeCursorParkingContent();
      document.body.appendChild(cursorParking);
      return {
        update(view, prevState) {
          const prevInputState = pluginKey.getState(prevState);
          const inputState = pluginKey.getState(view.state);
          if (!prevInputState.inCursorParking && inputState.inCursorParking) {
            selectCursorParkingContent();
          }
          if (prevInputState.inCursorParking && !inputState.inCursorParking) {
            const {
              dispatch,
              state: { tr }
            } = view;
            if (prevInputState.bookmarkToRestore) {
              tr.setSelection(prevInputState.bookmarkToRestore.resolve(tr.doc));
            }
            if (prevInputState.storedMarks) {
              tr.setStoredMarks(prevInputState.storedMarks);
            }
            view.focus();
            dispatch(tr);
            reinitializeCursorParkingContent();
          }
        },
        destroy() {
          cursorParking.remove();
        }
      };
    }
  });
}

// If you just need a quick toggle
export const toggleCursorParking = async (view: EditorView, park: boolean) => {
  if (park) {
    view.dispatch(
      view.state.tr.setMeta(pluginKey, {
        inCursorParking: true
      })
    );
  } else {
    view.dispatch(
      view.state.tr.setMeta(pluginKey, {
        inCursorParking: false
      })
    );
  }
};
