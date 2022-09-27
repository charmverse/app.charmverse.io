import { type BaseRawNodeSpec } from '@bangle.dev/core';
import type {
  DOMOutputSpec,
  Node
} from '@bangle.dev/pm';
import type { MarkdownSerializerState } from 'prosemirror-markdown';

const name = 'quote';

export function spec (): BaseRawNodeSpec {
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
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: (): DOMOutputSpec => {
        return ['blockquote', 0];
      }
    },
    markdown: {
      toMarkdown: (state: MarkdownSerializerState, node: Node) => {
        state.wrapBlock('> ', undefined, node, () => state.renderContent(node));
      },
      parseMarkdown: {
        blockquote: {
          block: name
        }
      }
    }
  };
}
