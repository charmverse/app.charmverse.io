import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';

export function spec () {
  return [
    databaseSpec()
  ];
}

function databaseSpec (): BaseRawNodeSpec {
  return {
    name: 'inlineDatabase',
    type: 'node',
    schema: {
      attrs: {
        pageId: {
          default: null
        }
      },
      atom: true,
      selectable: false,
      isolating: true,
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-database' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-database'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}
