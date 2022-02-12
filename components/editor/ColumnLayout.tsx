import type { RawSpecs } from '@bangle.dev/core';
import {
  DOMOutputSpec
} from '@bangle.dev/pm';

export const spec = specFactory;

const name = 'columnLayout';

function specFactory (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'columnBlock*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', 0];
      }
    }
  };
}
