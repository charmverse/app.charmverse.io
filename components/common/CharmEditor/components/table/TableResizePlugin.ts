/* eslint-disable no-continue */

// Based on https://github.com/chanzuckerberg/czi-prosemirror/blob/540fffb41d74e06064788999871bd23ca6e219a9/src/TableResizePlugin.js

// ...which is based on https://github.com/ProseMirror/prosemirror-tables/tree/master/src

// Copyright (C) 2015-2016 by Marijn Haverbeke <marijnh@gmail.com> and others
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// License about this file:
// This file is originally forked from
// https://github.com/ProseMirror/prosemirror-tables/blob/0e74c6a1761651ccf3701eb8529fa9187ad5c91d/src/columnresizing.js
// and most of the original codes had been modified to support the bevaviors
// that czi-prosemirror needs.
// The plugin provides the following behaviors:
// - Let user resize a column without changing the total width of the table.
// - Let user set the left margin of the table.
// - Let user set the right margin of the table.

import type { Node } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { TableView } from 'prosemirror-tables';
import { cellAround, pointsAtCell, tableNodeTypes, TableMap } from 'prosemirror-tables';
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';
import type { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';

import TableNodeView from './ui/TableNodeView';

type DraggingInfo = {
  columnElements: HTMLElement[];
  columnWidths: number[];
  startX: number;
  tableElement: HTMLElement;
  tableMarginLeft: number;
  tableMarginRight: number;
  tableWidth: number;
  tableWrapperWidth: number;
  targetColumnIndex: number;
};

type PointerEvent = {
  target: EventTarget;
  clientX: number;
  clientY: number;
};

const PLUGIN_KEY = new PluginKey('tableColumnResizing');
const CELL_MIN_WIDTH = 25;
const HANDLE_WIDTH = 20;

let cancelDrag: ((a?: any) => void) | null = null;

type ResizePluginState = {
  cellPos?: number | null;
  draggingInfo?: DraggingInfo | null;
  forMarginLeft?: boolean | null;
};

// The immutable plugin state that stores the information for resizing.
class ResizeState {
  cellPos?: number | null;

  forMarginLeft?: boolean | null;

  draggingInfo?: DraggingInfo | null;

  constructor(cellPos?: number | null, forMarginLeft?: boolean | null, draggingInfo?: DraggingInfo | null) {
    this.cellPos = cellPos;
    this.draggingInfo = draggingInfo;
    this.forMarginLeft = forMarginLeft;
  }

  apply(tr: Transaction): ResizeState {
    let state = this as ResizeState;
    const action = tr.getMeta(PLUGIN_KEY);
    if (action && typeof action.setCellPos === 'number') {
      return new ResizeState(action.setCellPos, action.setForMarginLeft, null);
    }

    if (action && !action.setDraggingInfo !== undefined) {
      return new ResizeState(state.cellPos, state.forMarginLeft, action.setDraggingInfo);
    }
    // console.log('set dragging info');
    if (state.cellPos && state.cellPos > -1 && tr.docChanged) {
      let cellPos: number | null = tr.mapping.map(state.cellPos, -1);
      if (!pointsAtCell(tr.doc.resolve(cellPos))) {
        cellPos = null;
      }
      state = new ResizeState(cellPos, cellPos ? state.forMarginLeft : false, state.draggingInfo);
    }
    return state;
  }
}

// Function that handles the mousemove event inside table cell.
function handleMouseMove(view: EditorView, event: PointerEvent): void {
  const resizeState = PLUGIN_KEY.getState(view.state) as ResizePluginState;
  if (resizeState.draggingInfo) {
    return;
  }

  const target = domCellAround(event.target);
  let forMarginLeft = false;
  let cell = -1;

  if (target instanceof HTMLElement) {
    const { left, right } = target.getBoundingClientRect();
    const offsetLeft = event.clientX - left;
    if (offsetLeft <= HANDLE_WIDTH) {
      if ((target as HTMLTableCellElement).cellIndex === 0) {
        forMarginLeft = true;
        cell = edgeCell(view, event, 'right', HANDLE_WIDTH);
      } else {
        cell = edgeCell(view, event, 'left', HANDLE_WIDTH);
      }
    } else if (right - event.clientX <= HANDLE_WIDTH) {
      cell = edgeCell(view, event, 'right', HANDLE_WIDTH);
    }
  }

  if (cell === resizeState.cellPos && forMarginLeft === resizeState.forMarginLeft) {
    return;
  }

  if (cell !== -1) {
    const $cell = view.state.doc.resolve(cell);
    if (!$cell) {
      return;
    }
  }

  updateResizeHandle(view, cell, forMarginLeft);
}

// Function that handles the mouseleave event from the table cell.
function handleMouseLeave(view: EditorView): void {
  const resizeState = PLUGIN_KEY.getState(view.state) as ResizePluginState;
  const { cellPos, draggingInfo } = resizeState;
  if (cellPos && cellPos > -1 && !draggingInfo) {
    updateResizeHandle(view, -1, false);
  }
}

// Function that handles the mousedown event from the table cell.
function handleMouseDown(view: EditorView, event: MouseEvent): boolean {
  // It's possible that the resize action that happened earlier was inturrupted
  // while its dependent mouse events were stopped or prevented by others.
  // We need to stop the previous resize action if it did not finish.
  if (cancelDrag) cancelDrag(event);

  const resizeState = PLUGIN_KEY.getState(view.state) as ResizePluginState;
  if (resizeState.cellPos === -1 || resizeState.draggingInfo) {
    return false;
  }

  let dragStarted = false;
  let dragMoveHandler: ReturnType<typeof batchMouseHandler> | null = null;

  function finish(e: MouseEvent) {
    window.removeEventListener('mouseup', finish, true);
    window.removeEventListener('mousemove', move, true);
    if (dragStarted) handleDragEnd(view);
    cancelDrag = null;
  }

  function move(e: MouseEvent) {
    if (e.which) {
      if (!dragStarted) {
        handleDragStart(view, e);
        dragStarted = true;
      }
      // Move events should be batched to avoid over-handling the mouse
      // event.
      dragMoveHandler = dragMoveHandler || batchMouseHandler(handleDragMove);
      dragMoveHandler(view, e);
    } else {
      finish(e);
    }
  }

  cancelDrag = finish;
  window.addEventListener('mouseup', finish, true);
  window.addEventListener('mousemove', move, true);
  event.preventDefault();
  return true;
}

function handleDragStart(view: EditorView, event: MouseEvent): void {
  const resizeState = PLUGIN_KEY.getState(view.state) as ResizePluginState;
  if (resizeState.cellPos === -1 || resizeState.draggingInfo) {
    return;
  }
  view.dispatch(
    view.state.tr.setMeta(PLUGIN_KEY, {
      setDraggingInfo: calculateDraggingInfo(view, event, resizeState)
    })
  );
}

// Function that handles the mouse event while resizing the table cell.
// This will temporarily updates the table's style until the resize ends.
function handleDragMove(view: EditorView, event: PointerEvent): void {
  const resizeState = PLUGIN_KEY.getState(view.state) as ResizePluginState;
  const { draggingInfo, forMarginLeft } = resizeState;
  if (!draggingInfo) {
    // console.log('DO NOT HANDLE DRAG MOVE', resizeState);
    return;
  }
  const { startX, columnWidths, targetColumnIndex, columnElements, tableElement, tableMarginLeft, tableMarginRight } =
    draggingInfo;

  let totalWidth = 0;
  let ml = tableMarginLeft;

  const dx = event.clientX - startX;
  const lastIndex = columnWidths.length - 1;

  const widths = columnWidths.map((cw, index) => {
    let ww;
    if (forMarginLeft) {
      if (index === 0) {
        // Resize the first column.
        ww = Math.min(Math.max(CELL_MIN_WIDTH, cw - dx), cw + tableMarginLeft);
        // Resize table's left margin.
        ml = Math.max(0, tableMarginLeft + cw - ww);
      } else {
        // The rest columns remain the same,
        ww = cw;
      }
    } else if (index === targetColumnIndex && index === lastIndex) {
      // Resize the last column.
      ww = Math.min(cw + tableMarginRight, Math.max(CELL_MIN_WIDTH, cw + dx));
    } else if (index === targetColumnIndex) {
      // Resize the column.
      ww = Math.min(Math.max(CELL_MIN_WIDTH, cw + dx), cw + (columnWidths[index + 1] || 0) - CELL_MIN_WIDTH);
    } else if (index === targetColumnIndex + 1) {
      // Resize the column's previous column.
      ww = Math.min(Math.max(CELL_MIN_WIDTH, cw - dx), cw + (columnWidths[index - 1] || 0) - CELL_MIN_WIDTH);
    } else {
      // This column does not resize.
      ww = cw;
    }

    totalWidth += ww;
    return ww;
  });

  const tableElementStyle = tableElement.style;
  tableElementStyle.marginLeft = `${ml}px`;
  tableElementStyle.width = `${Math.round(totalWidth)}px`;
  tableElementStyle.minWidth = '';
  columnElements.forEach((colEl, index) => {
    colEl.style.width = `${Math.round(widths[index])}px`;
  });
}

// Function that handles the mouse event while stop resizing the table cell.
function handleDragEnd(view: EditorView): void {
  const resizeState = PLUGIN_KEY.getState(view.state) as ResizePluginState;
  const { cellPos, draggingInfo } = resizeState;
  if (!draggingInfo) {
    return;
  }
  const { columnElements, tableElement } = draggingInfo;
  const widths = columnElements.map((colEl) => {
    return parseFloat(colEl.style.width);
  });

  const $cell = view.state.doc.resolve(cellPos!);
  const start = $cell.start(-1);
  const table = $cell.node(-1);
  const map = TableMap.get(table);
  let tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < widths.length; col++) {
      const mapIndex = row * map.width + col;
      if (row && map.map[mapIndex] === map.map[mapIndex - map.width]) {
        // Rowspanning cell that has already been handled
        continue;
      }
      const pos = map.map[mapIndex];
      const attrs = table.nodeAt(pos)!.attrs;
      const colspan = attrs.colspan || 1;
      const colwidth = widths.slice(col, col + colspan);

      if (colspan > 1) {
        // The current cell spans across multiple columns, this forwards to
        // the next cell for the next iteration.
        col += colspan - 1;
      }

      if (attrs.colwidth && compareNumbersList(attrs.colwidth, colwidth)) {
        continue;
      }

      tr = tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth });
    }
  }

  const marginLeft = parseFloat(tableElement.style.marginLeft) || null;
  if (table.attrs.marginLeft !== marginLeft) {
    const nodeType = table.type;
    const attrs = {
      ...table.attrs,
      marginLeft
    };
    const tableLookup = findParentNodeOfTypeClosestToPos($cell, view.state.schema.nodes[nodeType.name]);
    const tablePos = tableLookup && tableLookup.pos;
    if (tablePos === null || tablePos === undefined) {
      throw new Error('tablePos not found');
    }
    tr = tr.setNodeMarkup(tablePos, nodeType, attrs);
  }

  if (tr.docChanged) {
    // Let editor know the change.
    view.dispatch(tr);
  }
  // Hides the resize handle bars.
  view.dispatch(view.state.tr.setMeta(PLUGIN_KEY, { setDraggingInfo: null }));
}

// Helper that prepares the information needed before the resizing starts.
function calculateDraggingInfo(
  view: EditorView,
  event: MouseEvent,
  resizeState: ResizePluginState
): DraggingInfo | null {
  const { cellPos, forMarginLeft } = resizeState;
  const dom = view.domAtPos(cellPos!);
  const tableEl = (dom.node as HTMLElement).closest('table')!;
  const tableWrapper = tableEl.closest('.tableWrapper')!;
  const colGroupEl = tableEl.querySelector('colgroup');
  const colEls: HTMLElement[] = colGroupEl ? Array.from(colGroupEl.querySelectorAll('col')) : [];
  const tableWrapperRect = tableWrapper.getBoundingClientRect();
  const tableRect = tableEl.getBoundingClientRect();
  const defaultColumnWidth = tableWrapperRect.width / colEls.length;
  const startX = event.clientX;
  const offsetLeft = startX - tableRect.left;

  let tableWidth = 0;
  let targetColumnIndex = -1;

  const tableMarginLeftStyle = tableEl.style.marginLeft;
  const tableMarginLeft =
    tableMarginLeftStyle && /\d+px/.test(tableMarginLeftStyle) ? parseFloat(tableMarginLeftStyle) : 0;

  const tableMarginRight = tableWrapperRect.right - tableRect.right;

  // Calculate the inital width of each column.
  // Calculate the inital width of the table.
  // Find out the target column to resize.
  const columnWidths = Array.from(colEls).map((colEl, ii) => {
    const cssWidth = colEl.style.width;
    let colWidth = Math.max(CELL_MIN_WIDTH, (cssWidth && parseFloat(cssWidth)) || defaultColumnWidth);

    if (tableWidth + colWidth > tableWrapperRect.width) {
      // column is too wide, make it fit.
      colWidth -= tableWrapperRect.width - (tableWidth + colWidth);
    }

    // The edges of the column's right border.
    const edgeLeft = tableWidth + colWidth - HANDLE_WIDTH / 2;
    const edgeRight = tableWidth + colWidth + HANDLE_WIDTH / 2;
    if (offsetLeft >= edgeLeft && offsetLeft <= edgeRight) {
      // This is the column to resize.
      targetColumnIndex = ii;
    }
    tableWidth += colWidth;
    return colWidth;
  });

  if (forMarginLeft) {
    // Both the first column and the table's left margin should resize.
    targetColumnIndex = 0;
  }

  if (targetColumnIndex < 0) {
    // Nothing to resize. This happens when the mouse isn't nearby any position
    // that is alllowed to resize a column.
    return null;
  }

  return {
    columnElements: colEls,
    targetColumnIndex,
    columnWidths,
    startX,
    tableElement: tableEl,
    tableMarginLeft,
    tableMarginRight,
    tableWidth,
    tableWrapperWidth: tableWrapperRect.width
  };
}

// Helper that finds the closest cell element from a given event target.
function domCellAround(target: any): Element {
  while (target && target.nodeName !== 'TD' && target.nodeName !== 'TH') {
    target = target.classList.contains('ProseMirror') ? null : target.parentElement;
  }
  return target;
}

// Helper that resolves the prose-mirror node postion of a cell from a given
// event target.
function edgeCell(view: EditorView, event: PointerEvent, side: string, handleWidth: number): number {
  // posAtCoords returns inconsistent positions when cursor is moving
  // across a collapsed table border. Use an offset to adjust the
  // target viewport coordinates away from the table border.
  const offset = side === 'right' ? -handleWidth : handleWidth;
  const result = view.posAtCoords({
    left: event.clientX + offset,
    top: event.clientY
  });
  if (!result) return -1;
  const pos = result.pos;
  const $cell = pos && cellAround(view.state.doc.resolve(pos));
  if (!$cell) {
    return -1;
  }
  if (side === 'right') {
    return $cell.pos;
  }
  const map = TableMap.get($cell.node(-1));
  const start = $cell.start(-1);
  const index = map.map.indexOf($cell.pos - start);
  return index % map.width === 0 ? -1 : start + map.map[index - 1];
}

// Update the resize handler (UI) state.
function updateResizeHandle(view: EditorView, cellPos: number, forMarginLeft: boolean): void {
  view.dispatch(
    view.state.tr.setMeta(PLUGIN_KEY, {
      setCellPos: cellPos,
      setForMarginLeft: forMarginLeft
    })
  );
}

// Get the decorations that renders the resize handle bars.
function handleDecorations(
  state: EditorState,
  resizeState: Pick<ResizeState, 'cellPos' | 'forMarginLeft'>
): DecorationSet {
  if (!resizeState.cellPos) {
    return DecorationSet.create(state.doc, []);
  }
  const decorations = [];
  const $cell = state.doc.resolve(resizeState.cellPos);
  const table = $cell.node(-1);
  if (!table) {
    return DecorationSet.empty;
  }
  const map = TableMap.get(table);
  const start = $cell.start(-1);
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter!.attrs.colspan - 1;
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width;
    // For positions that have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col === map.width - 1 || map.map[index] !== map.map[index + 1]) &&
      (row === 0 || map.map[index] !== map.map[index - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos)!.nodeSize - 1;
      const dom = document.createElement('div');
      let className = 'column-resize-handle';
      if (resizeState.forMarginLeft) {
        className += ' for-margin-left';
      }
      dom.className = className;
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}

// Creates a custom table view that renders the margin-left style.
function createTableView(node: Node, view: EditorView): TableView {
  return new TableNodeView(node, CELL_MIN_WIDTH, view);
}

function batchMouseHandler(
  handler: (view: EditorView, pe: PointerEvent) => void
): (view: EditorView, me: MouseEvent) => void {
  let target: EventTarget | null = null;
  let clientX = 0;
  let clientY = 0;
  let view: EditorView | null = null;
  const onMouseEvent = () => {
    if (view && target) {
      const pointerEvent = {
        target,
        clientX,
        clientY
      };
      handler(view, pointerEvent);
    }
  };
  return function (ev: EditorView, me: MouseEvent) {
    target = me.target;
    clientX = me.clientX;
    clientY = me.clientY;
    view = ev;
    requestAnimationFrame(onMouseEvent);
  };
}

function compareNumbersList(one: number[], two: number[]): boolean {
  if (one.length !== two.length) {
    return false;
  }

  return !one.some((value, index) => two[index] !== value);
}

// Plugin that supports table columns resizing.
export default class TableResizePlugin extends Plugin {
  spec: any;

  constructor() {
    super({
      key: PLUGIN_KEY,
      state: {
        init(_: any, state: EditorState): ResizeState {
          (this as any).spec.props.nodeViews[tableNodeTypes(state.schema).table.name] = createTableView;
          return new ResizeState(-1);
        },
        apply(tr: Transaction, prev: EditorState): EditorState {
          return prev.apply(tr);
        }
      },
      props: {
        attributes(state: EditorState) {
          const resizeState = PLUGIN_KEY.getState(state) as ResizePluginState;
          return resizeState.cellPos! > -1 ? { class: 'resize-cursor' } : { class: '' };
        },
        handleDOMEvents: {
          // Move events should be batched to avoid over-handling the mouse
          // event.
          mousemove: batchMouseHandler(handleMouseMove),
          mouseleave: handleMouseLeave,
          mousedown: handleMouseDown
        },
        decorations(state: EditorState): DecorationSet | undefined {
          const resizeState = PLUGIN_KEY.getState(state) as ResizePluginState;
          return resizeState.cellPos! > -1 ? handleDecorations(state, resizeState) : undefined;
        },
        nodeViews: {}
      }
    });
  }
}
