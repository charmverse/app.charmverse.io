
import type { EditorState, Node } from '@bangle.dev/pm';
import { Fragment } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PreviewIcon from '@mui/icons-material/Preview';
import DatabaseIcon from '@mui/icons-material/TableChart';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { TextSelection } from 'prosemirror-state';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, VIDEO_ASPECT_RATIO } from 'lib/embed/constants';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

function createTableCell (state: EditorState, text: string) {
  return state.schema.nodes.table_cell.create(undefined, Fragment.fromArray([
    state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
      state.schema.text(text)
    ]))
  ]));
}

function createTableHeader (state: EditorState, text: string) {
  return state.schema.nodes.table_cell.create({ header: true }, Fragment.fromArray([
    state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
      state.schema.text(text)
    ]))
  ]));
}

function createColumnPaletteItem (colCount: number): PaletteItemTypeNoGroup {
  return {
    uid: `column ${colCount}`,
    title: `${colCount} Columns`,
    icon: <ViewColumnIcon
      sx={{ fontSize: 16 }}
    />,
    description: `${colCount} Column Layout`,
    editorExecuteCommand: () => {
      return (state, dispatch, view) => {
        if (view) {
          rafCommandExec(view!, (_state, _dispatch) => {

            const columnBlocks: Node[] = [];
            for (let index = 0; index < colCount; index++) {
              columnBlocks.push(
                _state.schema.nodes.columnBlock.create(undefined, Fragment.fromArray([
                  _state.schema.nodes.paragraph.create()
                ]))
              );
            }

            const node = _state.schema.nodes.columnLayout.create(
              undefined,
              Fragment.fromArray(columnBlocks)
            );

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
        return replaceSuggestionMarkWith(palettePluginKey, '')(
          state,
          dispatch,
          view
        );
      };
    }
  };
}

export function items (): PaletteItemTypeNoGroup[] {
  return [
    {
      uid: 'image',
      title: 'Image',
      icon: <ImageIcon
        sx={{ fontSize: 16 }}
      />,
      description: 'Insert a image block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.image.create({
              src: null
            });

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node));
              return true;
            }

            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    },
    {
      uid: 'pdf',
      title: 'PDF',
      icon: <PictureAsPdfIcon
        sx={{ fontSize: 16 }}
      />,
      description: 'Insert a PDF block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.pdf.create({
              src: null

            });

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node));
              return true;
            }

            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    },
    {
      uid: 'video',
      title: 'Video',
      icon: <VideoLibraryIcon
        sx={{ fontSize: 16 }}
      />,
      description: 'Insert a video block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {

              const node = _state.schema.nodes.iframe.create({
                src: null,
                type: 'video',
                width: MAX_EMBED_WIDTH,
                height: MAX_EMBED_WIDTH / VIDEO_ASPECT_RATIO
              });

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node));
                return true;
              }

              return insertNode(_state, _dispatch, node);
            });

            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view
            );
          }
          return false;
        };
      }
    },
    {
      uid: 'embed',
      title: 'Embed',
      icon: <PreviewIcon sx={{ fontSize: 16 }} />,
      keywords: ['iframe'],
      description: 'Insert an embed block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {

              const node = _state.schema.nodes.iframe.create({
                src: null,
                type: 'embed',
                width: MAX_EMBED_WIDTH,
                height: MIN_EMBED_HEIGHT
              });

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view
            );
          }
          return false;
        };
      }
    },
    {
      uid: 'insertSimpleTable',
      icon: <DatabaseIcon sx={{
        fontSize: 16
      }}
      />,
      title: 'Table',
      keywords: ['table'],
      description: 'Insert a simple table below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            return insertNode(_state, _dispatch, _state.schema.nodes.table.create(
              undefined,
              Fragment.fromArray([
                _state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                  createTableHeader(_state, 'Header 1'),
                  createTableHeader(_state, 'Header 2'),
                  createTableHeader(_state, 'Header 3')
                ])),
                _state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                  createTableCell(_state, 'Cell 1'),
                  createTableCell(_state, 'Cell 2'),
                  createTableCell(_state, 'Cell 3')
                ]))
              ])
            ));
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    },
    createColumnPaletteItem(2),
    createColumnPaletteItem(3),
    {
      uid: 'insertDisclosure',
      icon: <ArrowForwardIcon sx={{ fontSize: 16 }} />,
      title: 'Toggle List/Heading',
      keywords: ['summary', 'disclosure', 'toggle', 'collapse'],
      description: 'Insert a summary and content',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {

          rafCommandExec(view!, (_state, _dispatch) => {

            const { $from, $to } = _state.selection;
            const range = $from.blockRange($to);

            if (_dispatch && range) {
              const tr = _state.tr;
              tr.wrap(range, [
                {
                  type: _state.schema.nodes.disclosureDetails
                }
              ]);
              tr.insert(range.start + 1, _state.schema.nodes.disclosureSummary.createChecked(null, Fragment.fromArray([
                _state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([]))
              ])));
              const resolvedPos = tr.doc.resolve(range.start + 1);

              tr.setSelection(TextSelection.near(resolvedPos));

              _dispatch(tr);
            }
            return true;
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    }
  ];
}
