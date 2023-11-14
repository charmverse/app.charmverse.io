import type { DOMOutputSpec, Node } from '@bangle.dev/pm';
import { keymap, wrappingInputRule } from '@bangle.dev/pm';
import { getNodeType } from '@bangle.dev/utils';
import type { MarkdownSerializerState } from 'prosemirror-markdown';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

const name = 'quote';

export function spec(): BaseRawNodeSpec {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        track: { default: [] }
      },
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'blockquote.charm-quote' }],
      toDOM: (): DOMOutputSpec => {
        return ['blockquote', { class: 'charm-quote' }, 0];
      }
    },
    markdown: {
      toMarkdown: (state: MarkdownSerializerState, node: Node) => {
        state.wrapBlock('> ', null, node, () => state.renderContent(node));
      },
      parseMarkdown: {
        blockquote: {
          block: name
        }
      }
    }
  };
}

export function plugins(): RawPlugins {
  return ({ schema }) => {
    const type = getNodeType(schema, name);
    return [wrappingInputRule(/^\s*>\s$/, type)];
  };
}
