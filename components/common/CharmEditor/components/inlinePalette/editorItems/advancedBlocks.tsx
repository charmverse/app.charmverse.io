import type { Node } from '@bangle.dev/pm';
import { Fragment, setBlockType } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import CodeIcon from '@mui/icons-material/Code';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { TextSelection } from 'prosemirror-state';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

const iconSize = 30;

function createColumnPaletteItem(colCount: number): PaletteItemTypeNoGroup {
  return {
    uid: `column ${colCount}`,
    title: `${colCount} Columns`,
    icon: <ViewColumnIcon sx={{ fontSize: iconSize }} />,
    description: `${colCount} Column Layout`,
    editorExecuteCommand: () => {
      return (state, dispatch, view) => {
        if (view) {
          rafCommandExec(view!, (_state, _dispatch) => {
            const columnBlocks: Node[] = [];
            for (let index = 0; index < colCount; index++) {
              columnBlocks.push(
                _state.schema.nodes.columnBlock.create(
                  undefined,
                  Fragment.fromArray([_state.schema.nodes.paragraph.create()])
                )
              );
            }

            const node = _state.schema.nodes.columnLayout.create(undefined, Fragment.fromArray(columnBlocks));

            if (_dispatch && isAtBeginningOfLine(_state)) {
              let tr = _state.tr;
              const offset = tr.selection.anchor;
              tr = tr.replaceSelectionWith(node);

              // move cursor to first column
              const resolvedPos = tr.doc.resolve(offset);
              tr.setSelection(TextSelection.near(resolvedPos));

              _dispatch(tr);
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
        }
        return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
      };
    }
  };
}

export function items(): PaletteItemTypeNoGroup[] {
  return [
    createColumnPaletteItem(2),
    createColumnPaletteItem(3),
    {
      uid: 'code',
      title: 'Code',
      icon: (
        <CodeIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Insert a code block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              if (isAtBeginningOfLine(_state)) {
                return setBlockType(_state.schema.nodes.codeBlock, { language: 'Javascript' })(_state, _dispatch);
              }
              return insertNode(
                _state,
                _dispatch,
                state.schema.nodes.codeBlock.create({ language: 'Javascript' }, Fragment.fromArray([]))
              );
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    }
  ];
}
