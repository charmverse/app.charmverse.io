import { rafCommandExec, findParentNodeOfType } from '@bangle.dev/utils';
import { FormatListBulleted } from '@mui/icons-material';
import CodeIcon from '@mui/icons-material/Code';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { setBlockType } from 'prosemirror-commands';
import { Fragment } from 'prosemirror-model';
import type { Node } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

const iconSize = 30;

function createColumnPaletteItem(colCount: number): PaletteItemTypeNoGroup {
  return {
    uid: `column ${colCount}`,
    title: `${colCount} Columns`,
    icon: <ViewColumnIcon sx={{ fontSize: iconSize }} />,
    description: `${colCount} Column Layout`,
    editorExecuteCommand: ({ palettePluginKey }) => {
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
type AdvancedItemsProps = {
  view: EditorView;
  enableVoting?: boolean;
};

export function items({ view: currentView, enableVoting }: AdvancedItemsProps): PaletteItemTypeNoGroup[] {
  const hasColumnParent = findParentNodeOfType(currentView.state.schema.nodes.columnLayout)(
    currentView.state.selection
  );

  const editorItems: PaletteItemTypeNoGroup[] = [
    ...(hasColumnParent ? [] : [createColumnPaletteItem(2), createColumnPaletteItem(3)]),
    {
      uid: 'button',
      title: 'Button',
      icon: (
        <SmartButtonIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Insert a button in the line below',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              // let the node view know to show the tooltip by default
              const tooltipMark = _state.schema.mark('tooltip-marker');
              const node = _state.schema.nodes.button.create({}, null, [tooltipMark]);

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node, false));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
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
      editorExecuteCommand: ({ palettePluginKey }) => {
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

  if (enableVoting) {
    editorItems.push({
      uid: 'poll',
      title: 'Poll',
      icon: (
        <FormatListBulleted
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      keywords: ['vote'],
      description: 'Insert an embedded poll',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view!, (_state, _dispatch) => {
              // let the node view know to show the tooltip by default
              const tooltipMark = _state.schema.mark('tooltip-marker');
              const node = _state.schema.nodes.poll.create(
                {
                  src: null
                },
                null,
                [tooltipMark]
              );

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node, false));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    });
  }

  editorItems.push({
    uid: 'table-of-contents',
    title: 'Table of contents',
    keywords: ['table', 'contents', 'toc'],
    icon: (
      <FormatListBulleted
        sx={{
          fontSize: iconSize
        }}
      />
    ),
    description: 'Show an outline of your page',
    editorExecuteCommand: ({ palettePluginKey }) => {
      return (state, dispatch, view) => {
        if (view) {
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.tableOfContents.create();

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node, false));
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
        }
        return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
      };
    }
  });

  return editorItems;
}
