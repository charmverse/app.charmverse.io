import type { RawSpecs } from '@bangle.dev/core';
import {
  DOMOutputSpec
} from '@bangle.dev/pm';

export const spec = specFactory;

const name = 'columnBlock';

function specFactory (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', 0];
      }
    }
  };
}
