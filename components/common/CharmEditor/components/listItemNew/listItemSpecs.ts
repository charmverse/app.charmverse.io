import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node, NodeSpec } from 'prosemirror-model';

import { LIST_ITEM } from './nodeNames';

export const ATTRIBUTE_LIST_STYLE_TYPE = 'data-list-style-type';

const ListItemNodeSpec: NodeSpec = {
  // attrs: {
  //   align: { default: null }
  // },

  // NOTE:
  // This spec does not support nested lists (e.g. `'paragraph block*'`)
  // as content because of the complexity of dealing with indentation
  // (context: https://github.com/ProseMirror/prosemirror/issues/92).
  content: 'paragraph',
  defining: true,
  draggable: true,

  attrs: {
    // We overload the todoChecked value to
    // decide if its a regular bullet list or a list with todo
    // todoChecked can take following values:
    //   null => regular bullet list
    //   true => todo list with checked
    //   false => todo list with no check
    todoChecked: {
      default: null
    },
    track: {
      default: []
    }
  },

  parseDOM: [{ tag: 'li' }],
  // NOTE:
  // This method only defines the minimum HTML attributes needed when the node
  // is serialized to HTML string. Usually this is called when user copies
  // the node to clipboard.
  // The actual DOM rendering logic is defined at `./listItemNodeView.js`.
  toDOM(node): DOMOutputSpec {
    return ['li', { checked: node.attrs.todoChecked }, 0];
  },
  markdown: {
    toMarkdown(state: MarkdownSerializerState, node: Node) {
      if (node.attrs.todoChecked != null) {
        state.write(node.attrs.todoChecked ? '[x] ' : '[ ] ');
      }
      state.renderContent(node);
    }
  }
};

export function spec(): BaseRawNodeSpec {
  return {
    name: LIST_ITEM,
    type: 'node',
    schema: ListItemNodeSpec
  };
}
