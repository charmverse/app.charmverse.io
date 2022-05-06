import { RawSpecs } from '@bangle.dev/core';
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
    schema,
    type: 'node',
    markdown: {
      toMarkdown: () => null
    }
  }));
  return specs;
}
