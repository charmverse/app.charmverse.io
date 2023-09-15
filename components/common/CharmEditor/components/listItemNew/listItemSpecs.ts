import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { DOMOutputSpec, NodeSpec, Node } from 'prosemirror-model';

import { LIST_ITEM } from './nodeNames';

export const ATTRIBUTE_LIST_STYLE_TYPE = 'data-list-style-type';

const ListItemNodeSpec: NodeSpec = {
  attrs: {
    align: { default: null }
  },

  // NOTE:
  // This spec does not support nested lists (e.g. `'paragraph block*'`)
  // as content because of the complexity of dealing with indentation
  // (context: https://github.com/ProseMirror/prosemirror/issues/92).
  content: 'paragraph',

  parseDOM: [{ tag: 'li' }],

  // NOTE:
  // This method only defines the minimum HTML attributes needed when the node
  // is serialized to HTML string. Usually this is called when user copies
  // the node to clipboard.
  // The actual DOM rendering logic is defined at `./listItemNodeView.js`.
  toDOM(): DOMOutputSpec {
    return ['li', {}, 0];
  }
};

export function spec(): BaseRawNodeSpec {
  return {
    name: LIST_ITEM,
    type: 'node',
    schema: ListItemNodeSpec
  };
}
