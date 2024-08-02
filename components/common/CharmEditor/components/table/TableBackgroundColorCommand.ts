import type { EditorState, Transaction } from 'prosemirror-state';
import { setCellAttr } from 'prosemirror-tables';
import type { EditorView } from 'prosemirror-view';
import type { SyntheticEvent } from 'react';

import { ColorEditor } from './ui/ColorEditor';
import type { PopUpHandle } from './ui/createPopUp';
import createPopUp from './ui/createPopUp';
import UICommand from './ui/UICommand';

const setCellBackgroundBlack = setCellAttr('background', '#000000');

class TableBackgroundColorCommand extends UICommand {
  _popUp: PopUpHandle<null> | null = null;

  shouldRespondToUIEvent = (e: SyntheticEvent | MouseEvent): boolean => {
    return e.type === UICommand.EventType.MOUSEENTER;
  };

  isEnabled = (state: EditorState): boolean => {
    return setCellBackgroundBlack(state);
  };

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
    event?: SyntheticEvent
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
    hex?: string
  ): boolean => {
    if (dispatch && hex !== undefined) {
      const cmd = setCellAttr('background', hex);
      cmd(state, dispatch);
      return true;
    }
    return false;
  };

  cancel(): void {
    if (this._popUp) this._popUp.close(undefined);
  }
}

export default TableBackgroundColorCommand;
