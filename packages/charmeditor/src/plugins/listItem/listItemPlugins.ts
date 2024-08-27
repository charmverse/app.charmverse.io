import { isMac } from '@packages/utils/browser';
import { wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { EditorState } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';

import type { RawPlugins } from '../../buildEditorPlugins';
import { parentHasDirectParentOfType } from '../../commands';
import { filter } from '../../helpers';
import { BULLET_LIST, LIST_ITEM, ORDERED_LIST } from '../../nodeNames';

import { backspaceKeyCommand, enterKeyCommand, indentCommand, listItemMergeCommand, updateNodeAttrs } from './commands';
import { ListItemNodeView } from './listItemNodeView';
import { isNodeTodo, wrappingInputRuleForTodo } from './todo';

const isValidList = (state: EditorState) => {
  const type = state.schema.nodes[LIST_ITEM];
  return parentHasDirectParentOfType(type, [state.schema.nodes.bullet_list, state.schema.nodes.ordered_list]);
};

export function plugins({ readOnly }: { readOnly?: boolean } = {}): RawPlugins {
  return ({ schema }) => {
    return [
      new Plugin({
        props: {
          nodeViews: {
            [LIST_ITEM]: (node, view, getPos) => {
              return new ListItemNodeView(node, view, getPos, !!readOnly);
            }
          }
        }
      }),
      wrappingInputRule(
        /^(1)[.)]\s$/,
        schema.nodes[ORDERED_LIST],
        (match) => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1]
      ),
      // from bangle.dev:
      //       wrappingInputRule(/^\s*([-+*])\s$/, type, undefined, (_str, node) => {
      //         return true;
      //       })
      wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes[BULLET_LIST], undefined, (_str, node) => {
        if (node.lastChild && isNodeTodo(node.lastChild, schema)) {
          return false;
        }
        return true;
      }),
      wrappingInputRuleForTodo(/^\s*(\[ \])\s$/, {
        todoChecked: false
      }),
      keymap({
        // toggle done
        [isMac() ? 'Ctrl-Enter' : 'Ctrl-I']: filter(
          isValidList,
          updateNodeAttrs(schema.nodes[LIST_ITEM], (attrs) => ({
            ...attrs,
            todoChecked: attrs.todoChecked == null ? false : !attrs.todoChecked
          }))
        ),
        Enter: enterKeyCommand(),
        Tab: indentCommand(1),
        'Shift-Tab': indentCommand(-1),
        Backspace: backspaceKeyCommand(schema.nodes[BULLET_LIST]),
        // Backspace: listItemMergeCommand('up'),
        // "forward delete"
        Delete: listItemMergeCommand('down')
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
  };
}
