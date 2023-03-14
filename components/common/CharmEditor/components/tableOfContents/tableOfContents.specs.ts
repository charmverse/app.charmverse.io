import type { RawSpecs } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';

export function spec(): RawSpecs {
  return [
    {
      type: 'node',
      name: 'tableOfContents',
      schema: {
        inline: false,
        attrs: {
          track: {
            default: []
          }
        },
        group: 'block',
        parseDOM: [{ tag: 'toc' }],
        toDOM: (): DOMOutputSpec => {
          return ['toc'];
        },
        atom: true
      },
      markdown: {
        toMarkdown: (state, node) => {
          // try {
          //   state.write();
          //   state.ensureNewLine();
          // } catch (err) {
          //   log.warn('Conversion error (table of contents)', err);
          // }
        }
      }
    }
  ];
}
