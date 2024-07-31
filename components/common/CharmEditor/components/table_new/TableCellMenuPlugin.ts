import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import findActionableCell from './findActionableCell';
import bindScrollHandler, { ScrollHandle } from './ui/bindScrollHandler';
import createPopUp, { PopUpHandle } from './ui/createPopUp';
import isElementFullyVisible from './ui/isElementFullyVisible';
import { TableCellMenu } from './components/TableCellMenu/TableCellMenu';

class TableCellTooltipView {
  _cellElement: HTMLElement | null = null;

  _popUp: PopUpHandle<any> | null = null;

  _scrollHandle: ScrollHandle | null = null;

  constructor(editorView: EditorView) {
    this.update(editorView);
  }

  update(view: EditorView): void {
    // const { state, readOnly } = view;
    const { state } = view;
    const result = findActionableCell(state);

    // if (!result || readOnly) {
    if (!result) {
      this.destroy();
      return;
    }

    // These is screen coordinate.
    const domFound = view.domAtPos(result.pos + 1);
    if (!domFound) {
      this.destroy();
      return;
    }

    let cellEl: HTMLElement | null = domFound.node as HTMLElement;
    const popUp = this._popUp;
    const viewProps = {
      editorState: state,
      editorView: view
    };

    if (cellEl && !isElementFullyVisible(cellEl)) {
      cellEl = null;
    }
    console.log('cell El', cellEl);

    if (!cellEl) {
      // Closes the popup.
      popUp && popUp.close();
      this._cellElement = null;
    } else if (popUp && cellEl === this._cellElement) {
      // Updates the popup.
      popUp.update(viewProps);
    } else {
      // Creates a new popup.
      popUp && popUp.close();
      this._cellElement = cellEl;
      this._popUp = createPopUp(TableCellMenu, viewProps, {
        anchor: cellEl,
        onClose: this._onClose,
        placement: 'top-end'
        // position: 'atAnchorTopRight'
      });
      this._onOpen();
    }
  }

  destroy = (): void => {
    this._popUp && this._popUp.close();
    this._popUp = null;
  };

  _onOpen = (): void => {
    const cellEl = this._cellElement;
    if (!cellEl) {
      return;
    }
    this._scrollHandle = bindScrollHandler(cellEl, this._onScroll);
  };

  _onClose = (): void => {
    this._popUp = null;
    this._scrollHandle && this._scrollHandle.dispose();
    this._scrollHandle = null;
  };

  _onScroll = (): void => {
    const popUp = this._popUp;
    const cellEl = this._cellElement;
    if (!popUp || !cellEl) {
      return;
    }
    if (!isElementFullyVisible(cellEl)) {
      popUp.close();
    }
  };
}

// https://prosemirror.net/examples/tooltip/
const SPEC = {
  view(editorView: EditorView) {
    return new TableCellTooltipView(editorView);
  }
};

class TableCellMenuPlugin extends Plugin {
  constructor() {
    super(SPEC);
  }
}

export default TableCellMenuPlugin;
