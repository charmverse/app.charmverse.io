import { createObject } from '@bangle.dev/utils';
import { keymap } from 'prosemirror-keymap';
import { Plugin } from 'prosemirror-state';

import { indentCommand, splitListCommand } from './commands';
import { ListItemNodeView } from './listItemNodeView';
import { BULLET_LIST, LIST_ITEM } from './nodeNames';

export function plugins() {
  return [
    new Plugin({
      props: {
        nodeViews: {
          [LIST_ITEM]: (node) => {
            return new ListItemNodeView(node);
          }
        }
      }
    }),
    keymap({
      Enter: splitListCommand(),
      Tab: indentCommand(1)
      // [KEY_BACK_DELETE.common]: LIST_ITEM_MERGE_UP.execute,
      // [KEY_FORWARD_DELETE.common]: LIST_ITEM_MERGE_DOWN.execute,
    })
    //   createObject([
    //     [keybindings.toCodeBlock, setBlockType(type)],

    //     [keybindings.moveUp, moveNode(type, 'UP')],
    //     [keybindings.moveDown, moveNode(type, 'DOWN')],

    //     [
    //       keybindings.insertEmptyParaAbove,
    //       filter(queryIsCodeActiveBlock(), insertEmpty(schema.nodes.paragraph, 'above', false))
    //     ],
    //     [
    //       keybindings.insertEmptyParaBelow,
    //       filter(queryIsCodeActiveBlock(), insertEmpty(schema.nodes.paragraph, 'below', false))
    //     ],
    //     [
    //       keybindings.tab,
    //       filter(queryIsCodeActiveBlock(), (state: EditorState, dispatch, view?: EditorView) => {
    //         if (dispatch && view) {
    //           dispatch(state.tr.insertText('\t'));
    //           view?.focus();
    //         }
    //         return true;
    //       })
    //     ]
    //   ])
    // )
  ];
}
