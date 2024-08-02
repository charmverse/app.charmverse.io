import type { EditorState, Transaction } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { SyntheticEvent } from 'react';

import { insertTable } from './insertTable';
import type { PopUpHandle } from './ui/createPopUp';
import createPopUp from './ui/createPopUp';
import TableGridSizeEditor from './ui/TableGridSizeEditor';
import type { TableGridSizeEditorValue } from './ui/TableGridSizeEditor';
import UICommand from './ui/UICommand';

class TableInsertCommand extends UICommand {
  _popUp: PopUpHandle<null> | null = null;

  shouldRespondToUIEvent = (e: SyntheticEvent | MouseEvent): boolean => {
    return e.type === UICommand.EventType.MOUSEENTER;
  };

  isEnabled = (state: EditorState): boolean => {
    const tr = state;
    const { selection } = tr;
    if (selection instanceof TextSelection) {
      return selection.from === selection.to;
    }
    return false;
  };

  waitForUserInput = (
    state: EditorState,
    dispatch?: ((tr: Transaction) => void) | null,
    view?: EditorView | null,
    event?: SyntheticEvent | null
  ): Promise<any> => {
    if (this._popUp) {
      return Promise.resolve(undefined);
    }
    const target = event?.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return Promise.resolve(undefined);
    }

    const anchor = event ? event.currentTarget : null;
    return new Promise((resolve) => {
      // @ts-ignore
      this._popUp = createPopUp(TableGridSizeEditor, null, {
        anchor,
        placement: 'right',
        popper: 'popover',
        onClose: (val) => {
          if (this._popUp) {
            this._popUp = null;
            resolve(val);
          }
        }
      });
    });
  };

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
    inputs?: TableGridSizeEditorValue
  ): boolean => {
    if (dispatch) {
      const { selection, schema } = state;
      let { tr } = state;
      if (inputs) {
        const { rows, cols } = inputs;
        tr = tr.setSelection(selection);
        tr = insertTable(tr, schema, rows, cols);
      }
      dispatch(tr);
    }
    return false;
  };
}

export default TableInsertCommand;
