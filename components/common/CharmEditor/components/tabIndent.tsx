import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';
import { keymap } from '@bangle.dev/pm';

const name = 'tabIndent';

export function spec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      group: 'inline',
      parseDOM: [{ tag: 'span.charm-tab' }],
      toDOM: (): DOMOutputSpec => ['span', { className: 'charm-tab', style: 'white-space:pre' }, '\t'],
      attrs: {}
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function plugins (): RawPlugins {
  return [
    keymap({
      // 'Shift-Tab': undentListItem,
      Tab: (state, dispatch) => {
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
        }
        return true;
      }
    })
  ];
}
