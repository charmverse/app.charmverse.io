import { RawPlugins, RawSpecs, NodeView } from '@bangle.dev/core';
import { DOMOutputSpec, keymap, newlineInCode, splitBlock, createParagraphNear, EditorState, EditorView, Transaction, chainCommands } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { Selection } from 'prosemirror-state';

import { createObject, filter, insertEmpty } from '@bangle.dev/utils';

export function rowSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'columnLayout',
    schema: {
      content: 'columnBlock+',
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
  return ({ schema }) => {

    const isColumnBlock = parentHasDirectParentOfType(schema.nodes.columnBlock, schema.nodes.columnLayout);

    return [
      keymap(
        createObject([
          // 'Shift-Tab': undentListItem,
          ['Tab', filter(isColumnBlock, (state, dispatch) => {
            // if (dispatch) {
            //   dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
            // }
            console.log('Tab state', state, !!dispatch);
            return false;
          })],
          // 'Shift-Tab': undentListItem,
          ['Mod-Enter', filter(isColumnBlock, exitColumn)],
          ['Enter', filter(isColumnBlock, chainCommands(newlineInCode, createParagraphNear, splitBlock))]
        ])
      ),
      NodeView.createPlugin({
        name: 'columnLayout',
        containerDOM: ['div', { class: 'charm-column' }],
        contentDOM: ['div']
      }),
      NodeView.createPlugin({
        name: 'columnBlock',
        containerDOM: ['div', { class: 'charm-column-row' }],
        contentDOM: ['div']
      })
    ];
  };
}
function exitColumn (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, view: EditorView<any> | undefined) {
  return insertEmpty(state.schema.nodes.paragraph, 'below', true)(state, dispatch, view);
}
