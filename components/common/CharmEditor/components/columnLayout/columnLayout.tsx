import { RawPlugins, RawSpecs, NodeView } from '@bangle.dev/core';
import { DOMOutputSpec, keymap, newlineInCode, splitBlock, createParagraphNear, EditorState, EditorView, Transaction, Plugin, chainCommands } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';

import { createObject, filter, insertEmpty } from '@bangle.dev/utils';

export function rowSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'columnLayout',
    schema: {
      content: 'columnBlock+',
      isolating: true,
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
      isolating: true,
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
      // plugin to prevent deleting column blocks: https://github.com/ueberdosis/tiptap/issues/181#issuecomment-745067085
      // new Plugin({
      //   props: {
      //     handleKeyDown: (view, event) => {
      //       if (event.key === 'Delete' || event.key === 'Backspace') {
      //         // @ts-ignore
      //         view.state.deleting = true;
      //       }

      //       return false;
      //     }
      //   },

      //   filterTransaction: (transaction, state) => {
      //     // @ts-ignore
      //     if (!state.deleting) {
      //       return true;
      //     }
      //     console.log('deleting?', transaction, state);

      //     let result = true;

      //     transaction.mapping.maps.forEach(map => {
      //       map.forEach((oldStart, oldEnd) => {
      //         console.log('mapping', oldStart, oldEnd);
      //         state.doc.nodesBetween(oldStart, oldEnd, (node) => {
      //           console.log('dete', node.type.name);
      //           if (node.type.name === 'columnLayout') {
      //             result = false;
      //           }
      //         });
      //       });
      //     });
      //     console.log('filter?', result);
      //     return result;
      //   }
      // })
    ];
  };
}
function exitColumn (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, view: EditorView<any> | undefined) {
  return insertEmpty(state.schema.nodes.paragraph, 'below', true)(state, dispatch, view);
}
