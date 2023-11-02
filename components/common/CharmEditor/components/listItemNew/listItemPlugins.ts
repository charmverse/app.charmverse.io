import { wrappingInputRule, chainCommands } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject, filter } from '@bangle.dev/utils';
import { keymap } from 'prosemirror-keymap';
import type { EditorState } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { isMac } from 'lib/utilities/browser';

import { updateNodeAttrs, indentCommand, listItemMergeCommand, backspaceKeyCommand, enterKeyCommand } from './commands';
import { ListItemNodeView } from './listItemNodeView';
import { BULLET_LIST, ORDERED_LIST, LIST_ITEM } from './nodeNames';
import { isNodeTodo, wrappingInputRuleForTodo } from './todo';

const isValidList = (state: EditorState) => {
  const type = state.schema.nodes[LIST_ITEM];
  return parentHasDirectParentOfType(type, [state.schema.nodes.bullet_list, state.schema.nodes.ordered_list]);
};

export function plugins({ readOnly }: { readOnly: boolean }): RawPlugins {
  return ({ schema }) => {
    return [
      new Plugin({
        props: {
          nodeViews: {
            [LIST_ITEM]: (node, view, getPos) => {
              return new ListItemNodeView(node, view, getPos, readOnly);
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
          updateNodeAttrs(schema.nodes.list_item, (attrs) => ({
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
