import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject, filter, insertEmpty } from '@bangle.dev/utils';
import { chainCommands, createParagraphNear, newlineInCode, splitBlock } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import type { PluginKey, EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';

import { ColumnNodeView } from './plugins/column';
import { ResizeBarDecoration } from './plugins/resizeBar';
import { RowNodeView } from './plugins/row';

export function plugins({ key, readOnly }: { key: PluginKey; readOnly: boolean }): RawPlugins {
  return ({ schema }) => {
    const isColumnBlock = parentHasDirectParentOfType(schema.nodes.columnBlock, schema.nodes.columnLayout);

    return [
      keymap(
        createObject([
          ['Mod-Enter', filter(isColumnBlock, exitColumn)],
          ['Enter', filter(isColumnBlock, chainCommands(newlineInCode, createParagraphNear, splitBlock))]
        ])
      ),
      ResizeBarDecoration(),
      RowNodeView({
        key,
        name: 'columnLayout',
        readOnly
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
