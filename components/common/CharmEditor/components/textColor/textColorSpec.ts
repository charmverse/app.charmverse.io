import type { BaseRawMarkSpec } from '@bangle.dev/core';
import type { Mark } from 'prosemirror-model';

const markName = 'textColor';

export function spec(): BaseRawMarkSpec {
  return {
    name: markName,
    type: 'mark',
    schema: {
      attrs: {
        color: {
          default: ''
        },
        bgColor: {
          default: ''
        }
      },
      inline: true,
      group: 'inline',
      parseDOM: [
        {
          tag: 'span',
          getAttrs: (dom: any) => {
            return {
              color: dom.getAttribute('data-color'),
              bgColor: dom.getAttribute('data-bg-color')
            };
          }
        }
      ],
      toDOM(node: Mark) {
        const { color, bgColor } = node.attrs;
        let style = '';
        if (color) {
          style += `color: ${color};`;
        } else if (bgColor) {
          style += `background-color: ${color};`;
        }
        return ['span', { 'data-color': color, 'data-bg-color': bgColor, style }, 0];
      }
    }
  };
}
