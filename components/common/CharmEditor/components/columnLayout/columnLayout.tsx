import { RawPlugins, RawSpecs, NodeView } from '@bangle.dev/core';
import { DOMOutputSpec, keymap } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { ReactNode, memo } from 'react';

export function rowSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'columnLayout',
    schema: {
      content: 'columnBlock*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-column-row' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-column-row' }];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function columnSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'columnBlock',
    schema: {
      content: 'block*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-column' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-column', 0];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function plugins (): RawPlugins {
  return [
    keymap({
      // 'Shift-Tab': undentListItem,
      Tab: (state, dispatch) => {
        // if (dispatch) {
        //   dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
        // }
        console.log('Tab state', state, !!dispatch);
        return false;
      },
      // 'Shift-Tab': undentListItem,
      Enter: (state, dispatch) => {
        // if (dispatch) {
        //   dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
        // }
        console.log('Enter state', state, !!dispatch);
        return false;
      }
    }),
    NodeView.createPlugin({
      name: 'columnLayout',
      containerDOM: ['div'],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'columnBlock',
      containerDOM: ['div'],
      contentDOM: ['div']
    })
  ];
}
