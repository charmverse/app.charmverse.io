import type { RawSpecs } from '@bangle.dev/core';
import * as tables from '@skiff-org/prosemirror-tables';

export * from '@skiff-org/prosemirror-tables';

export function spec (): RawSpecs {
  const schemas = tables.tableNodes({
    cellAttributes: { },
    cellContent: 'block+',
    cellContentGroup: 'block',
    tableGroup: 'block'
  });

  const specs = Object.entries(schemas).map(([name, schema]): RawSpecs => ({
    name,
    schema: {
      ...schema,
      attrs: {
        ...schema.attrs || {},
        track: {
          default: []
        }
      }
    },
    type: 'node',
    markdown: {
      toMarkdown: (state, node) => {

        const withHeader = node.attrs.headers === true;

        let tableAsMarkdown = '';

        const columnCount = node.content.firstChild?.childCount ?? 0;

        node.content.forEach((row, offset, index) => {

          // Setup left hand marker. Each cell adds its own right hand delimiter
          tableAsMarkdown += '\r\n|';

          // Populate cells
          for (let i = 0; i < columnCount; i++) {

            const cell = row.child(i);

            // eslint-disable-next-line no-loop-func
            cell.firstChild?.forEach(nestedNode => {
              if (nestedNode.type.name === 'hardBreak') {
                tableAsMarkdown += '<br>';
              }
              else {
                tableAsMarkdown += nestedNode.textContent;
              }
            });

            tableAsMarkdown += '|';

          }

          // Add delimiters for header row after adding header names
          if (index === 0 && withHeader === true) {
            tableAsMarkdown += '\r\n|';

            for (let i = 0; i < columnCount; i++) {
              tableAsMarkdown += '---|';
            }
          }
        });

        state.ensureNewLine();

        state.text(tableAsMarkdown);

        state.ensureNewLine();

      }
    }
  }));
  return specs;
}
