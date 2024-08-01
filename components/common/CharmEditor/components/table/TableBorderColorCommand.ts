import type { EditorState, Transaction } from 'prosemirror-state';
import { setCellAttr } from 'prosemirror-tables';
import type { EditorView } from 'prosemirror-view';
import type { SyntheticEvent } from 'react';

import { ColorEditor } from './ui/ColorEditor';
import type { PopUpHandle } from './ui/createPopUp';
import createPopUp from './ui/createPopUp';
import UICommand from './ui/UICommand';

const setCellBorderBlack = setCellAttr('borderColor', '#000000');

class TableBorderColorCommand extends UICommand {
  _popUp: PopUpHandle<null> | null = null;

  shouldRespondToUIEvent = (e: SyntheticEvent | MouseEvent): boolean => {
    return e.type === UICommand.EventType.MOUSEENTER;
  };

  isEnabled = (state: EditorState): boolean => {
    return setCellBorderBlack(state);
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
      this._popUp = createPopUp(ColorEditor, null, {
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
    color?: string
  ): boolean => {
    if (dispatch && color !== undefined) {
      const cmd = setCellAttr('borderColor', color);
      cmd(state, dispatch, view);
      return true;
    }
    return false;
  };

  cancel(): void {
    if (this._popUp) this._popUp.close(undefined);
  }
}

export default TableBorderColorCommand;
