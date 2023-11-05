import { keymap } from 'prosemirror-keymap';
import * as table from 'prosemirror-tables';

import { TableView } from './tableView';

export function plugins() {
  const p = [
    table.columnResizing({
      View: TableView
    }),
    table.tableEditing({ allowTableNodeSelection: true }),
    // table.columnHandles()
    keymap({
      Tab: table.goToNextCell(1),
      'Shift-Tab': table.goToNextCell(-1)
    })
    // @ts-ignore missing type
    // table.tablePopUpMenu(),
    // @ts-ignore missing type
    // table.tableHeadersMenu(),
    // @ts-ignore missing type
    // table.selectionShadowPlugin()
    // @ts-ignore missing type
    //  table.TableFiltersMenu()
  ];
  return p;
}
