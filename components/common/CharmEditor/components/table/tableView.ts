import type { Node } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';

import { addBottomRow, addRightColumn } from './commands';
import type { CellAttrs } from './utils';
import { createElementWithClass } from './utils';

const createAddCellsButton = (type: string, view: EditorView) => {
  const isRow = type === 'row';
  const newElement = createElementWithClass(
    'button',
    `tableButton ${isRow ? 'tableAddBottomRow' : 'tableAddRightColumn'}`
  );
  newElement.innerHTML = '+';
  newElement.dataset.test = `test-${isRow ? 'tableAddBottomRow' : 'tableAddRightColumn'}`;
  newElement.contentEditable = 'false';
  newElement.onclick = () => {
    (isRow ? addBottomRow : addRightColumn)(view.state, view.dispatch);
    view.focus();
  };
  return newElement;
};

export class TableView {
  cellMinWidth: number;

  colgroup: HTMLTableColElement;

  contentDOM: HTMLElement;

  dom: HTMLElement;

  node: Node;

  table: HTMLTableElement;

  // tableHandle: HTMLElement;

  tableHorizontalWrapper: HTMLElement;

  tableVerticalWrapper: HTMLElement;

  tableWrapper: HTMLElement;

  view: EditorView;

  constructor(node: Node, cellMinWidth: number, view: EditorView) {
    this.node = node;
    this.view = view;
    this.cellMinWidth = cellMinWidth;
    const tableScrollWrapper = createElementWithClass('div', 'tableScrollWrapper');
    this.tableWrapper = tableScrollWrapper.appendChild(createElementWithClass('div', 'tableWrapper'));
    this.dom = tableScrollWrapper;
    this.dom.dataset.test = 'test-table-wrapper';

    // this.tableHandle = createElementWithClass('div', 'tableHandle');
    this.tableHorizontalWrapper = createElementWithClass('div', 'tableHorizontalWrapper');
    this.tableVerticalWrapper = createElementWithClass('div', 'tableVerticalWrapper');

    // this.tableHandle.onclick = (e) => this.selectTable(e);
    // this.tableHandle.onmousedown = (e) => e.preventDefault();
    // this.tableHandle.contentEditable = 'false';

    // this.tableWrapper.appendChild(this.tableHandle);
    this.tableWrapper.appendChild(this.tableHorizontalWrapper);
    this.tableHorizontalWrapper.appendChild(this.tableVerticalWrapper);

    this.table = this.tableVerticalWrapper.appendChild(document.createElement('table'));
    setTimeout(() => {
      this.updateMarkers();
    }, 0);
    this.tableVerticalWrapper.appendChild(createAddCellsButton('row', view));
    this.tableHorizontalWrapper.appendChild(createAddCellsButton('column', view));

    this.colgroup = this.table.appendChild(document.createElement('colgroup'));
    updateColumnsOnResize(node, this.colgroup, this.table, cellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement('tbody'));

    const tableDeleteButton = document.createElement('div');
    tableDeleteButton.classList.add('tableDeleteButton', 'MuiButtonBase-root');
    let nodePosition: null | number = null;
    view.state.doc.descendants((descendantNode, pos) => {
      if (descendantNode === node) {
        nodePosition = pos;
        return false;
      }
    });

    tableDeleteButton.onclick = () => {
      if (nodePosition !== null) {
        const tr = view.state.tr;
        tr.deleteRange(nodePosition, nodePosition + node.nodeSize);
        view.dispatch(tr);
      }
    };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('MuiSvgIcon-root');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      'M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z'
    );
    svg.appendChild(path);
    tableDeleteButton.appendChild(svg);
    this.table.appendChild(tableDeleteButton);

    this.table.classList.add('charm-table');
  }

  updateMarkers() {
    const rowMarkers = this.table.querySelectorAll<HTMLElement>('.addRowAfterMarker');

    rowMarkers.forEach((marker) => {
      marker.setAttribute('style', `width: ${this.table.offsetWidth + 15}px`);
    });

    const colMarkers = this.table.querySelectorAll('.addColAfterMarker');

    colMarkers.forEach((marker) => {
      marker.setAttribute('style', `height: ${this.table.offsetHeight + 15}px`);
    });
  }

  // selectTable(e) {
  //   const { tr } = this.view.state;
  //   tr.setSelection(NodeSelection.create(tr.doc, this.getPos()));
  //   this.view.dispatch(tr);

  //   e.preventDefault();
  // }

  update(node: Node) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    updateColumnsOnResize(node, this.colgroup, this.table, this.cellMinWidth);
    return true;
  }

  ignoreMutation(record: MutationRecord) {
    return record.type === 'attributes' && (record.target === this.table || this.colgroup.contains(record.target));
  }
}

export function updateColumnsOnResize(
  node: Node,
  colgroup: HTMLTableColElement,
  table: HTMLTableElement,
  cellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number
): void {
  let totalWidth = 0;
  let fixedWidth = true;
  let nextDOM = colgroup.firstChild as HTMLElement;
  const row = node.firstChild;
  if (!row) return;

  for (let i = 0, col = 0; i < row.childCount; i++) {
    const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth = overrideCol === col ? overrideValue : colwidth && colwidth[j];
      const cssWidth = hasWidth ? `${hasWidth}px` : '';
      totalWidth += hasWidth || cellMinWidth;
      if (!hasWidth) fixedWidth = false;
      if (!nextDOM) {
        colgroup.appendChild(document.createElement('col')).style.width = cssWidth;
      } else {
        if (nextDOM.style.width !== cssWidth) nextDOM.style.width = cssWidth;
        nextDOM = nextDOM.nextSibling as HTMLElement;
      }
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling;
    nextDOM.parentNode?.removeChild(nextDOM);
    nextDOM = after as HTMLElement;
  }

  if (fixedWidth) {
    table.style.width = `${totalWidth}px`;
    table.style.minWidth = '';
  } else {
    table.style.width = '';
    table.style.minWidth = `${totalWidth}px`;
  }
}
