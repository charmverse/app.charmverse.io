import type { Node } from 'prosemirror-model';

import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import { name } from './config';

export type NodeAttrs = {
  align: 'left' | 'center' | 'right';
  body: string;
  label: string;
  method: 'GET' | 'POST';
  size: 'small' | 'medium' | 'large';
  successMessage: string;
  url: string;
};

export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { label, url, method, body } = node.attrs as NodeAttrs;

        const toRender = `Button: ${label} ${url} ${method} ${body}`;

        // Ensure markdown html will be separated by newlines
        state.ensureNewLine();
        state.text(toRender);
        state.ensureNewLine();
      }
    },
    schema: {
      attrs: {
        label: {
          default: 'Submit'
        },
        url: {
          default: ''
        },
        method: {
          default: 'GET'
        },
        body: {
          default: ''
        },
        track: {
          default: []
        },
        align: {
          default: 'center'
        },
        size: {
          default: 'medium'
        },
        successMessage: {
          default: ''
        }
      },
      group: 'block',
      inline: false,
      draggable: true,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'div.pm-button',
          getAttrs: (dom: any) => {
            return {
              align: dom.getAttribute('data-align'),
              body: dom.getAttribute('data-body'),
              label: dom.getAttribute('data-label'),
              method: dom.getAttribute('data-method'),
              size: dom.getAttribute('data-size'),
              successMessage: dom.getAttribute('data-message')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return [
          'div',
          {
            class: 'pm-button',
            'data-align': node.attrs.align,
            'data-body': node.attrs.body,
            'data-label': node.attrs.label,
            'data-method': node.attrs.method,
            'data-size': node.attrs.size,
            'data-message': node.attrs.message
          }
        ];
      }
    }
  };
}
