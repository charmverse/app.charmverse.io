import type Token from 'markdown-it/lib/token.mjs';
import type { Node, NodeSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from '../buildSchema';
import { LIST_ITEM, ORDERED_LIST } from '../nodeNames';

import { ATTRIBUTE_INDENT, MIN_INDENT_LEVEL } from './bulletList';
import { ATTRIBUTE_LIST_STYLE_TYPE } from './listItem/listItemSpec';

export const ATTRIBUTE_COUNTER_RESET = 'data-counter-reset';
export const ATTRIBUTE_FOLLOWING = 'data-following';
const AUTO_LIST_STYLE_TYPES = ['decimal', 'lower-alpha', 'lower-roman'];

type Attrs = {
  counterReset?: string | null;
  following?: string | null;
  indent: number;
  listStyleType: string | null;
  name?: string | null;
  start: number;
  type?: string;
};

type HtmlAttrs = {
  [ATTRIBUTE_INDENT]?: number;
  [ATTRIBUTE_FOLLOWING]?: string;
  [ATTRIBUTE_LIST_STYLE_TYPE]?: string;
  [ATTRIBUTE_COUNTER_RESET]?: string;
  start?: number;
  name?: string;
  style?: string;
};

const OrderedListNodeSpec: NodeSpec = {
  attrs: {
    counterReset: { default: null },
    indent: { default: MIN_INDENT_LEVEL },
    listStyleType: { default: null },
    start: { default: 1 }
  },
  group: 'block',
  content: `${LIST_ITEM}+`,
  parseDOM: [
    {
      tag: 'ol',
      getAttrs(dom: HTMLElement | string): Attrs | null {
        if (typeof dom === 'string') return null;
        const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE);
        const counterReset = dom.getAttribute(ATTRIBUTE_COUNTER_RESET) || undefined;

        const start = dom.hasAttribute('start') ? parseInt(dom.getAttribute('start') || '', 10) : 1;

        const indent = dom.hasAttribute(ATTRIBUTE_INDENT)
          ? parseInt(dom.getAttribute(ATTRIBUTE_INDENT) || '', 10)
          : MIN_INDENT_LEVEL;

        const name = dom.getAttribute('name') || undefined;

        const following = dom.getAttribute(ATTRIBUTE_FOLLOWING) || undefined;
        const type = dom.getAttribute('type') || undefined;

        return {
          counterReset,
          following,
          indent,
          listStyleType,
          name,
          start,
          type
        };
      }
    }
  ],
  toDOM(node: Node) {
    const { start, indent, listStyleType, counterReset, following, type } = node.attrs as Attrs;
    const attrs: HtmlAttrs = {
      [ATTRIBUTE_INDENT]: indent
    };

    if (counterReset === 'none') {
      attrs[ATTRIBUTE_COUNTER_RESET] = counterReset;
    }

    if (following) {
      attrs[ATTRIBUTE_FOLLOWING] = following;
    }

    if (listStyleType) {
      attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType;
    }

    if (start !== 1) {
      attrs.start = start;
    }

    let htmlListStyleType = listStyleType;

    if (!htmlListStyleType || htmlListStyleType === 'decimal') {
      htmlListStyleType = AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length];
    }

    const cssCounterName = `czi-counter-${indent}`;
    attrs.style =
      `--czi-counter-name: ${cssCounterName};` +
      `--czi-counter-reset: ${following ? 'none' : start - 1};` +
      `--czi-list-style-type: ${htmlListStyleType}`;

    return ['ol', attrs, 0];
  }
};

export function spec(): BaseRawNodeSpec {
  return {
    name: ORDERED_LIST,
    type: 'node',
    schema: OrderedListNodeSpec,
    markdown: {
      toMarkdown(state, node) {
        const start = node.attrs.start || 1;
        const maxW = String(start + node.childCount - 1).length;
        const space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i) => {
          const nStr = String(start + i);
          return `${state.repeat(' ', maxW - nStr.length) + nStr}. `;
        });
      },
      parseMarkdown: {
        ordered_list: {
          block: ORDERED_LIST,
          // copied from bangle.dev
          getAttrs: (tok: Token, tokens: Token[], i: number) => {
            return {
              order: +(tok.attrGet('start') ?? 1)
            };
          }
        }
      }
    }
  };
}
