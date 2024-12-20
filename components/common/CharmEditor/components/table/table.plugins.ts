import { tableEditing } from 'prosemirror-tables';

import TableCellMenuPlugin from './TableCellMenuPlugin';
import TableResizePlugin from './TableResizePlugin';

// Tables
// https://github.com/ProseMirror/prosemirror-tables/blob/master/demo.js
export const plugins = [new TableCellMenuPlugin(), new TableResizePlugin(), tableEditing()];
