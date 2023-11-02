import type { DOMOutputSpec } from '@bangle.dev/pm';
import { keymap } from '@bangle.dev/pm';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

const name = 'tabIndent';

export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      group: 'inline',
      parseDOM: [{ tag: 'span.charm-tab' }],
      toDOM: (node): DOMOutputSpec => [
        'span',
        { class: 'charm-tab', 'data-indent': node.attrs.indent || 0, style: 'white-space:pre' },
        '\t'
      ],
      attrs: {
        indent: { default: 0 }
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function plugins(): RawPlugins {
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
