import * as table from 'prosemirror-tables';

export function plugins() {
  const p = [
    table.columnResizing(),
    table.tableEditing({ allowTableNodeSelection: true })
    // table.columnHandles(),
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
