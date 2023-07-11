import type { RawPlugins } from '@bangle.dev/core';
import type { PluginKey } from '@bangle.dev/pm';
import { chainCommands, createParagraphNear, keymap, newlineInCode, splitBlock } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject, filter, insertEmpty } from '@bangle.dev/utils';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { ColumnNodeView } from './plugins/column';
import { ResizeBarDecoration } from './plugins/resizeBar';
import { RowNodeView } from './plugins/row';

export function plugins({ key }: { key: PluginKey }): RawPlugins {
  return ({ schema }) => {
    const isColumnBlock = parentHasDirectParentOfType(schema.nodes.columnBlock, schema.nodes.columnLayout);

    return [
      keymap(
        createObject([
          // 'Shift-Tab': undentListItem,
          [
            'Tab',
            filter(isColumnBlock, (state, dispatch) => {
              // if (dispatch) {
              //   dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
              // }
              return false;
            })
          ],
          // 'Shift-Tab': undentListItem,
          ['Mod-Enter', filter(isColumnBlock, exitColumn)],
          ['Enter', filter(isColumnBlock, chainCommands(newlineInCode, createParagraphNear, splitBlock))]
        ])
      ),
      ResizeBarDecoration(),
      RowNodeView({
        key,
        name: 'columnLayout'
      }),
      ColumnNodeView({
        name: 'columnBlock'
      })
    ];
  };
}

function exitColumn(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  view: EditorView | undefined
) {
  return insertEmpty(state.schema.nodes.paragraph, 'below', true)(state, dispatch, view);
}
