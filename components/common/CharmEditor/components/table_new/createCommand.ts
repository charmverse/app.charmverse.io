import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import UICommand from './ui/UICommand';

type ExecuteCall = (
  state: EditorState,
  dispatch?: ((tr: Transaction) => void) | null,
  view?: EditorView | null
) => boolean;

export default function createCommand(execute: ExecuteCall): UICommand {
  class CustomCommand extends UICommand {
    isEnabled = (state: EditorState): boolean => {
      return this.execute(state);
    };

    execute = (
      state: EditorState,
      dispatch?: ((tr: Transaction) => void) | null,
      view?: EditorView | null
    ): boolean => {
      const tr = state.tr;
      let endTr = tr;
      execute(
        state,
        (nextTr) => {
          endTr = nextTr;
          if (dispatch) dispatch(endTr);
        },
        view
      );
      return endTr.docChanged || tr !== endTr;
    };
  }
  return new CustomCommand();
}
