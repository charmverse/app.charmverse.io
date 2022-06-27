import { BaseRawNodeSpec } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';

export function pdfSpec () {
  const spec: BaseRawNodeSpec = {
    name: 'pdf',
    type: 'node',
    schema: {
      attrs: {
        base: {
          default: null
        },
        quote: {
          default: null
        }
      },
      group: 'block',
      parseDOM: [{ tag: 'div.charm-pdf' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-pdf'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
  return spec;
}

export function PDF () {

  return (
    <div>
    </div>
  );
}
