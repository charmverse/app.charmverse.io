import type { BaseRawMarkSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import { MARK_TEXT_SELECTION } from './markNames';

export function spec(): BaseRawMarkSpec {
  return {
    name: MARK_TEXT_SELECTION,
    type: 'mark',
    schema: {
      attrs: {
        id: {
          default: null
        }
      },
      inline: true,
      group: 'inline',
      parseDOM: [
        {
          tag: 'czi-text-selection'
        }
      ],
      toDOM() {
        return ['czi-text-selection', { class: 'czi-text-selection' }, 0];
      }
    }
  };
}
