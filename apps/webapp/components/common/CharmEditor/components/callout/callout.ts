import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node } from 'prosemirror-model';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

const name = 'blockquote';

const defaultIcon = '😃';

export function spec(): BaseRawNodeSpec {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        emoji: { default: defaultIcon },
        track: { default: [] }
      },
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [
        {
          tag: 'blockquote.charm-callout',
          getAttrs: (dom: any) => ({
            emoji: dom.getAttribute('data-emoji')
          })
        }
      ],
      toDOM(node): DOMOutputSpec {
        return ['blockquote', { class: 'charm-callout', 'data-emoji': node.attrs.emoji }, 0];
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
  return [
    NodeView.createPlugin({
      name: 'blockquote',
      containerDOM: ['blockquote'],
      contentDOM: ['div']
    })
  ];
}
