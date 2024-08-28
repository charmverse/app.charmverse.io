import { getNodeType } from '@bangle.dev/utils';
import { wrappingInputRule } from 'prosemirror-inputrules';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node } from 'prosemirror-model';

import type { RawPlugins } from '../@bangle.dev/core/plugin-loader';
import type { BaseRawNodeSpec } from '../@bangle.dev/core/specRegistry';

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
