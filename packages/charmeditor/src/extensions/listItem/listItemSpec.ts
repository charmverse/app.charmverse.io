import type Token from 'markdown-it/lib/token.mjs';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node, NodeSpec } from 'prosemirror-model';

import type { BaseSpec } from '../../buildSchema';
import { LIST_ITEM } from '../../nodeNames';

import { spec as markSpec } from './markSpec';

export const ATTRIBUTE_LIST_STYLE_TYPE = 'data-list-style-type';

const ListItemNodeSpec: NodeSpec = {
  // attrs: {
  //   align: { default: null }
  // },

  // NOTE:
  // This spec does not support nested lists (e.g. `'paragraph block*'`)
  // as content because of the complexity of dealing with indentation
  // (context: https://github.com/ProseMirror/prosemirror/issues/92).
  content: 'paragraph+',
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

export const spec: BaseSpec[] = [
  {
    name: LIST_ITEM,
    type: 'node',
    schema: ListItemNodeSpec,
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        if (node.attrs.todoChecked != null) {
          state.write(node.attrs.todoChecked ? '[x] ' : '[ ] ');
        }
        state.renderContent(node);
      },
      parseMarkdown: {
        list_item: {
          block: LIST_ITEM,
          // copied from bangle.dev
          getAttrs: (tok: Token) => {
            let todoChecked = null;
            const todoIsDone = tok.attrGet('isDone');
            if (todoIsDone === 'yes') {
              todoChecked = true;
            } else if (todoIsDone === 'no') {
              todoChecked = false;
            }
            return {
              todoChecked
            };
          }
        }
      }
    }
  },
  markSpec()
];
