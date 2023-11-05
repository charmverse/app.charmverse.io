// This file defines a number of table-related commands.

// Source: https://github.com/skiff-org/prosemirror-tables/blob/master/src/commands.js

import type { Node } from 'prosemirror-model';
import type { Transaction, EditorState } from 'prosemirror-state';
import { TextSelection, Selection } from 'prosemirror-state';
import type { Rect, TableRect } from 'prosemirror-tables';
import { addRow, TableMap, CellSelection, addColumn, removeColumn, removeRow, selectionCell } from 'prosemirror-tables';
import { findParentNodeOfTypeClosestToPos, findParentNodeOfType } from 'prosemirror-utils';
import type { EditorView } from 'prosemirror-view';

import { sortNumVsString } from './utils';

type DispatchFn = (tr: Transaction) => void;

export function addBottomRow(state: EditorState, dispatch: DispatchFn) {
  if (dispatch) {
    const table = findParentNodeOfType(state.schema.nodes.table)(state.selection);
    if (!table) return false;
    const rect = {
      tableStart: table.start,
      table: table.node,
      map: TableMap.get(table.node)
    } as TableRect;
    const tr = addRow(state.tr, rect, rect.map.height);
    dispatch(tr);
  }
  return true;
}

export function addRightColumn(state: EditorState, dispatch: DispatchFn) {
  if (dispatch) {
    const table = findParentNodeOfType(state.schema.nodes.table)(state.selection);
    if (!table) return false;
    const rect = {
      tableStart: table.start,
      table: table.node,
      map: TableMap.get(table.node)
    } as TableRect; // lie, since the methods we use do not use the properties of React: left, top, right, etc.
    const tr = addColumn(state.tr, rect, rect.map.width);
    dispatch(tr);
  }
  return true;
}

// :: (EditorState, ?(tr: Transaction)) → bool
// Selects the current cell the cursor is in
export function selectCurrentCell(state: EditorState, dispatch: DispatchFn) {
  const currentCell = selectionCell(state);
  if (!currentCell || !dispatch) {
    return false;
  }
  const selection = new CellSelection(currentCell);
  dispatch(state.tr.setSelection(selection));
  return true;
}

const getRectFromPos = (pos: number, state: EditorState) => {
  const resPos = state.doc.resolve(pos);
  const table = findParentNodeOfTypeClosestToPos(resPos, state.schema.nodes.table);
  if (!table) return null;

  const rect = {
    tableStart: table.start,
    table: table.node,
    map: TableMap.get(table.node)
  } as TableRect; // lie, since the methods we use do not use the properties of React: left, top, right, etc.

  return rect;
};

export function sortColumn(view: EditorView, colNumber: number, pos: number, dir: number) {
  const rect = getRectFromPos(pos, view.state);
  if (!rect) return;

  const header = (rect?.table.content as any).content[0];
  let newRowsArray: Node[] = (rect?.table.content as any).contentslice(1);
  const { tr } = view.state;

  const columnType = (newRowsArray[0].content as any).content[colNumber].attrs.type;
  const defaultSort = (direction: number, cellA: HTMLElement, cellB: HTMLElement) => {
    const textA = cellA.textContent?.trim().replace(/[^a-zA-Z0-9\-.]/g, '') ?? '';
    const textB = cellB.textContent?.trim().replace(/[^a-zA-Z0-9\-.]/g, '') ?? '';

    return sortNumVsString(direction, textA, textB);
  };

  const sortCompareFunction = defaultSort; // columnTypesMap[columnType].sortCompareFunction || defaultSort;

  newRowsArray = newRowsArray.sort((rowA, rowB) =>
    sortCompareFunction(dir, (rowA.content as any).content[colNumber], (rowB.content as any).content[colNumber])
  );

  // No need for typeInheritance because we haven't changed the column's type or added new cells
  tr.replaceWith(rect.tableStart, rect.tableStart + rect.table.content.size, [header, ...newRowsArray]);
  tr.setNodeMarkup(rect.tableStart - 1, rect.table.type, {
    ...rect.table.attrs,
    sort: { col: colNumber, dir: dir === 1 ? 'down' : 'up' }
  });

  tr.setSelection(Selection.near(tr.doc.resolve(pos)));

  view.dispatch(tr);

  return true;
}

export const addRowBeforeButton = (view: EditorView, pos: number) => {
  const tableRect = getRectFromPos(pos, view.state);
  if (!tableRect) return;

  const cellIndex = tableRect?.map.map.indexOf(pos - tableRect.tableStart);

  if (cellIndex === -1) return;

  const rowNumber = cellIndex / tableRect.map.width;

  const tr = addRow(view.state.tr, tableRect, rowNumber);

  view.dispatch(tr);
  view.focus();
};

export const addColBeforeButton = (view: EditorView, pos: number) => {
  const tableRect = getRectFromPos(pos, view.state);
  if (!tableRect) return;

  const cellIndex = tableRect.map.map.indexOf(pos - tableRect.tableStart);

  if (cellIndex === -1) return;

  const colNumber = cellIndex % tableRect.map.width;

  const tr = addColumn(view.state.tr, tableRect, colNumber);

  view.dispatch(tr);
  view.focus();
};

export const addColAfterButton = (view: EditorView, pos: number) => {
  const tableRect = getRectFromPos(pos, view.state);
  if (!tableRect) return;

  const cellIndex = tableRect.map.map.indexOf(pos - tableRect.tableStart);

  if (cellIndex === -1) return;

  const colNumber = cellIndex % tableRect.map.width;

  const tr = addColumn(view.state.tr, tableRect, colNumber + 1);

  view.dispatch(tr);
  view.focus();
};

export const selectRow = (e: MouseEvent, view: EditorView, pos: number) => {
  const { state } = view;
  const sel = view.state.selection;
  const { tr } = state;

  if (sel instanceof CellSelection && sel.isRowSelection() && e.shiftKey) {
    tr.setSelection(CellSelection.rowSelection(sel.$anchorCell, state.doc.resolve(pos)));
  } else {
    tr.setSelection(CellSelection.rowSelection(state.doc.resolve(pos)));
  }

  view.dispatch(tr);
};

export const selectCol = (e: MouseEvent, view: EditorView, pos: number) => {
  const { state } = view;
  const sel = view.state.selection;
  const { tr } = state;

  if (sel instanceof CellSelection && sel.isColSelection() && e.shiftKey) {
    tr.setSelection(CellSelection.colSelection(sel.$anchorCell, state.doc.resolve(pos)));
  } else {
    tr.setSelection(CellSelection.colSelection(state.doc.resolve(pos)));
  }

  view.dispatch(tr);
};
const getTableRectBySelection = (state: EditorState) => {
  const resolvedPos = state.doc.resolve(state.selection.from);
  const tableWithPos = findParentNodeOfTypeClosestToPos(resolvedPos, state.schema.nodes.table);
  if (!tableWithPos) return false;
  const map = TableMap.get(tableWithPos.node);
  const rect = {
    table: tableWithPos.node,
    tableStart: tableWithPos.pos,
    map
  } as TableRect;

  return rect;
};

export const deleteLastRow = (state: EditorState, dispatch: DispatchFn) => {
  const rect = getTableRectBySelection(state);
  if (!rect) return false;

  const { tr } = state;
  removeRow(tr, rect, rect.map.height - 1);

  tr.setSelection(
    TextSelection.create(tr.doc, rect.map.map[rect.map.map.length - rect.map.width * 2] + rect.tableStart)
  );

  dispatch(tr);
};

export const deleteLastCol = (state: EditorState, dispatch: DispatchFn) => {
  const rect = getTableRectBySelection(state);
  if (!rect) return false;

  const { tr } = state;
  removeColumn(tr, rect, rect.map.width - 1);

  tr.setSelection(TextSelection.create(tr.doc, rect.map.map[rect.map.width * 2 - 3] + rect.tableStart));

  dispatch(tr);
};

export const changeCellsBackgroundColor = (state: EditorState, dispatch: DispatchFn, color: string) => {
  if (!(state.selection instanceof CellSelection)) return;

  const { tr } = state;
  state.selection.forEachCell((cell, pos) => {
    tr.setNodeMarkup(pos, undefined, { ...cell.attrs, background: color });
  });
  dispatch(tr);
};

export const isCellColorActive = (state: EditorState, color: string) => {
  const { selection: sel } = state;
  if (!(sel instanceof CellSelection)) return false;
  let colorActive = true;
  sel.forEachCell((node) => {
    colorActive = colorActive && node.attrs.background === color;
  });
  return colorActive;
};

// export const toggleTableHeaders = (state: EditorState, dispatch: DispatchFn, view: EditorView) => {
//   const { map, tableStart, table } = selectedRect(state);
//   const { tr } = state;
//   tr.setNodeMarkup(tableStart - 1, table.type, {
//     headers: !table.attrs.headers
//   });

//   if (table.attrs.headers) {
//     const cellsSelection = CellSelection.create(
//       tr.doc,
//       tableStart + map.map[0],
//       tableStart + map.map[map.map.length - 1]
//     );
//     const textType = columnTypesMap.text.handler;
//     const reversedCells: { cell: any; pos: number }[] = [];
//     cellsSelection.forEachCell((cell, pos: number) => reversedCells.unshift({ cell, pos }));

//     reversedCells.forEach(({ cell, pos }) => {
//       tr.replaceRangeWith(
//         pos + 1,
//         pos + cell.nodeSize - 1,
//         textType.renderContentNode(view.state.schema, textType.convertContent(cell), tr, pos)
//       );

//       const newAttrs = Object.assign(cell.attrs, {
//         type: 'text'
//       });

//       tr.setNodeMarkup(pos, undefined, newAttrs);
//     });
//   }

//   dispatch(tr);
// };
