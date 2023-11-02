// @ref: https://github.com/chanzuckerberg/czi-prosemirror/blob/master/src/TextColorMarkSpec.js

import { log } from '@charmverse/core/log';
import type { Mark } from 'prosemirror-model';

import type { BaseRawMarkSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import type { TextColorAttrs } from './config';
import { markName } from './config';

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
        const { color, bgColor } = node.attrs as TextColorAttrs;
        let style = '';
        if (color) {
          style += `color: var(--text-${color});`;
        } else if (bgColor) {
          style += `background-color: var(--bg-${bgColor});`;
        }
        return ['span', { 'data-color': color, 'data-bg-color': bgColor, style }, 0];
      }
    },
    markdown: {
      toMarkdown: {
        open: '',
        close: ''
      }
    }
  };
}
