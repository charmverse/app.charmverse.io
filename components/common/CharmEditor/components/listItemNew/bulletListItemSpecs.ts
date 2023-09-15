import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { Node, DOMOutputSpec, NodeSpec } from 'prosemirror-model';

import { ATTRIBUTE_LIST_STYLE_TYPE } from './listItemSpecs';
import { BULLET_LIST, LIST_ITEM } from './nodeNames';

export const ATTRIBUTE_INDENT = 'data-indent';
export const MIN_INDENT_LEVEL = 0;

export const RESERVED_STYLE_NONE = 'None';

const AUTO_LIST_STYLE_TYPES = ['disc', 'square', 'circle'];

type Attrs = {
  indent: number;
  listStyleType: string | null;
};

type HtmlAttrs = {
  [ATTRIBUTE_INDENT]?: number;
  [ATTRIBUTE_LIST_STYLE_TYPE]?: string;
  type?: string;
};

const BulletListNodeSpec: NodeSpec = {
  attrs: {
    indent: { default: 0 },
    listStyleType: { default: null }
  },
  group: 'block',
  content: `${LIST_ITEM}+`,
  parseDOM: [
    {
      tag: 'ul',
      getAttrs(dom: HTMLElement | string) {
        if (typeof dom === 'string') return null;
        const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE) || null;

        const indent = dom.hasAttribute(ATTRIBUTE_INDENT)
          ? parseInt(dom.getAttribute(ATTRIBUTE_INDENT) || '', 10)
          : MIN_INDENT_LEVEL;
        return {
          indent,
          listStyleType
        };
      }
    }
  ],

  toDOM(node: Node): DOMOutputSpec {
    const { indent, listStyleType } = node.attrs as Attrs;
    const attrs: HtmlAttrs = {};
    // [FS] IRAD-947 2020-05-26
    // Bullet list type changing fix
    attrs[ATTRIBUTE_INDENT] = indent;
    if (listStyleType) {
      attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType;
    }

    let htmlListStyleType = listStyleType;

    if (!htmlListStyleType || htmlListStyleType === 'disc') {
      htmlListStyleType = AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length];
    }

    attrs.type = htmlListStyleType;
    return ['ul', attrs, 0];
  }
};

export function spec(): BaseRawNodeSpec {
  return {
    name: BULLET_LIST,
    type: 'node',
    schema: BulletListNodeSpec
  };
}
