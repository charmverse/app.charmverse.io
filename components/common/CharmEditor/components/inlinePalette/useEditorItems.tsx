import {
  bulletList, orderedList,
  paragraph
} from '@bangle.dev/base-components';
import { EditorState, Fragment, Node, setBlockType, Transaction } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PreviewIcon from '@mui/icons-material/Preview';
import DatabaseIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import useNestedPage from 'components/common/CharmEditor/components/nestedPage/hooks/useNestedPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, VIDEO_ASPECT_RATIO } from 'lib/embed/constants';
import { addPage } from 'lib/pages';
import { PluginKey, TextSelection } from 'prosemirror-state';
import { useMemo } from 'react';
import { insertNode } from '../../utils';
import { NestedPagePluginState, nestedPageSuggestMarkName } from '../nestedPage';
import {
  isList
} from './commands';
import { palettePluginKey } from './config';
import { replaceSuggestionMarkWith } from './inlinePalette';
import { PaletteItem, PaletteItemType, PromisedCommand } from './paletteItem';

const { convertToParagraph } = paragraph;
const {
  toggleTodoList,
  queryIsBulletListActive,
  queryIsTodoListActive,
  toggleBulletList
} = bulletList;
const { toggleOrderedList, queryIsOrderedListActive } = orderedList;

const setHeadingBlockType = (level: number) => (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined) => {
  const type = state.schema.nodes.heading;
  return setBlockType(type, { level })(state, dispatch);
};

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

function createColumnPaletteItem (colCount: number): Omit<PaletteItemType, 'group'> {
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

type PaletteGroup = 'list' | 'media' | 'other' | 'text' | 'database';

const paletteGroupItemsRecord: Record<PaletteGroup, readonly Omit<PaletteItemType, 'group'>[]> = {
  other: [
    {
      uid: 'price',
      title: 'Crypto price',
      icon: <InsertChartIcon sx={{ fontSize: 16 }} />,
      description: 'Display a crypto price',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            // Execute the animation
            rafCommandExec(view!, (_state, _dispatch) => {

              const node = _state.schema.nodes.cryptoPrice.create();

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node));
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
    },
    {
      uid: 'horizontal_rule',
      title: 'Horizontal Rule',
      icon: <HorizontalRuleIcon sx={{ fontSize: 16 }} />,
      description: 'Display horizontal rule',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          // Execute the animation
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.horizontalRule.create();
            if (_dispatch && isAtBeginningOfLine(state)) {
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
    }
  ],
  media: [
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
  ],
  text: [
    {
      uid: 'paraConvert',
      keywords: ['paragraph', 'text'],
      title: 'Text',
      icon: <TextFieldsIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Convert the current block to paragraph',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            if (queryIsTodoListActive()(_state)) {
              return toggleTodoList()(_state, _dispatch, _view);
            }
            if (queryIsBulletListActive()(_state)) {
              return toggleBulletList()(_state, _dispatch, _view);
            }
            if (queryIsOrderedListActive()(_state)) {
              return toggleOrderedList()(_state, _dispatch, _view);
            }
            return convertToParagraph()(_state, _dispatch, _view);
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
      uid: 'code',
      title: 'Code',
      icon: <CodeIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Insert a code block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              if (isAtBeginningOfLine(_state)) {
                return setBlockType(_state.schema.nodes.codeBlock, { language: 'Javascript' })(_state, _dispatch);
              }
              return insertNode(_state, _dispatch, state.schema.nodes.codeBlock.create(
                { language: 'Javascript' },
                Fragment.fromArray([])
              ));
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    },
    {
      uid: 'callout',
      title: 'Callout',
      icon: <ChatBubbleIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Insert a callout block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {

            const node = _state.schema.nodes.blockquote.create(
              undefined,
              Fragment.fromArray([
                _state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([]))
              ])
            );

            if (_dispatch && isAtBeginningOfLine(_state)) {
              const tr = _state.tr;
              tr.replaceSelectionWith(node);
              // move cursor to block
              const offset = tr.selection.$head.end(1); // param 1 is node deep
              const resolvedPos = tr.doc.resolve(offset);
              tr.setSelection(TextSelection.near(resolvedPos));
              _dispatch(tr);
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
      uid: 'quote',
      title: 'Quote',
      icon: <ChatOutlinedIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Insert a quote in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {

            const node = _state.schema.nodes.quote.create(
              undefined,
              Fragment.fromArray([
                _state.schema.nodes.paragraph.create()
              ])
            );

            if (_dispatch && isAtBeginningOfLine(_state)) {
              const tr = _state.tr;
              tr.replaceSelectionWith(node);
              // move cursor to block
              const offset = tr.selection.$head.end(1); // param 1 is node deep
              const resolvedPos = tr.doc.resolve(offset);
              tr.setSelection(TextSelection.near(resolvedPos));
              _dispatch(tr);
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
    ...Array.from({ length: 3 }, (_, i) => {
      const level = i + 1;
      return {
        uid: `headingConvert${level}`,
        icon: <svg stroke='currentColor' fill='currentColor' strokeWidth={0} viewBox='0 0 512 512' height='1em' width='1em' xmlns='http://www.w3.org/2000/svg'><path d='M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z' /></svg>,
        title: `Heading ${level}`,
        description: `Convert the current block to heading level ${level}`,
        disabled: (state) => {
          const result = isList()(state);
          return result;
        },
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, setHeadingBlockType(level));
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view
            );
          };
        }
      } as Omit<PaletteItemType, 'group'>;
    })
  ],
  list: [
    {
      uid: 'bulletListConvert',
      title: 'Bullet List',
      icon: <FormatListBulletedIcon sx={{
        fontSize: 16
      }}
      />,
      keywords: ['unordered', 'lists'],
      description: 'Convert the current block to bullet list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            setBlockType(_state.schema.nodes.paragraph)(_state, _dispatch);
            return toggleBulletList()(_view!.state, _view!.dispatch, _view);
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
      uid: 'todoListConvert',
      title: 'Todo List',
      icon: <LibraryAddCheckIcon sx={{
        fontSize: 16
      }}
      />,
      keywords: ['todo', 'lists', 'checkbox', 'checked'],
      description: 'Convert the current block to todo list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            setBlockType(_state.schema.nodes.paragraph)(_state, _dispatch);
            return toggleTodoList()(_view!.state, _view!.dispatch, _view);
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
      uid: 'orderedListConvert',
      icon: <FormatListNumberedIcon sx={{
        fontSize: 16
      }}
      />,
      title: 'Ordered List',
      keywords: ['numbered', 'lists'],
      description: 'Convert the current block to ordered list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            setBlockType(_state.schema.nodes.paragraph)(_state, _dispatch);
            return toggleOrderedList()(_view!.state, _view!.dispatch, _view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    }
  ],
  database: [{
    uid: 'inlineLinkedDatabase',
    keywords: ['database', 'board'],
    title: 'Linked view of database',
    icon: <DatabaseIcon sx={{ fontSize: 16 }} />,
    description: 'Embed a view from an existing board',
    editorExecuteCommand: () => {
      return (state, dispatch, view) => {
        // Execute the animation
        rafCommandExec(view!, (_state, _dispatch) => {
          const node = _state.schema.nodes.inlineDatabase.create();
          if (_dispatch && isAtBeginningOfLine(state)) {
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
  }]
};

const sortedGroupList: PaletteGroup[] = ['list', 'media', 'other', 'text', 'database'];

export function useEditorItems ({ nestedPagePluginKey }: {nestedPagePluginKey?: PluginKey<NestedPagePluginState>}) {
  const { addNestedPage } = useNestedPage();
  const [space] = useCurrentSpace();
  const { user } = useUser();
  const { currentPageId } = usePages();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  const dynamicOther = [
    {
      uid: 'insert-board',
      title: 'Insert board',
      keywords: ['board'],
      requiredSpacePermission: 'createPage',
      icon: <DatabaseIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Insert a new board',
      editorExecuteCommand: (() => {
        return (async (state, dispatch, view) => {
          await addNestedPage('board');
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        }) as PromisedCommand;
      })
    },
    {
      uid: 'insert-page',
      title: 'Insert page',
      requiredSpacePermission: 'createPage',
      keywords: ['page'],
      icon: <DescriptionOutlinedIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Insert a new page',
      editorExecuteCommand: (() => {
        return (async (state, dispatch, view) => {
          await addNestedPage();
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        }) as PromisedCommand;
      })
    },
    {
      uid: 'link-to-page',
      title: 'Link to page',
      keywords: ['link', 'page'],
      icon: <DescriptionOutlinedIcon sx={{
        fontSize: 16
      }}
      />,
      description: 'Link to a new page',
      editorExecuteCommand: (() => {
        return (async (state, dispatch, view) => {
          if (nestedPagePluginKey) {
            const nestedPagePluginState = nestedPagePluginKey.getState(state);
            if (nestedPagePluginState) {
              replaceSuggestionMarkWith(palettePluginKey, state.schema.text(' ', state.schema.marks[nestedPageSuggestMarkName].create({})), true)(
                state,
                dispatch,
                view
              );
            }
            return false;
          }
          return false;
        }) as PromisedCommand;
      })
    }
  ] as Omit<PaletteItemType, 'group'>[];

  if (space && user) {
    paletteGroupItemsRecord.database.push({
      uid: 'inlineDatabase',
      title: 'Database - inline',
      icon: <DatabaseIcon sx={{ fontSize: 16 }} />,
      description: 'Add a new inline database to this page',
      keywords: ['database', 'board'],
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          // Execute the animation
          rafCommandExec(view!, (_state, _dispatch) => {
            // The page must be created before the node can be created
            addPage({ type: 'inline_board', parentId: currentPageId, spaceId: space.id, createdBy: user.id }).then(({ page, view: boardView }) => {
              const node = _state.schema.nodes.inlineDatabase.create({
                source: 'board_page',
                pageId: page.id,
                viewId: boardView?.id,
                type: 'embedded'
              });

              if (_dispatch && isAtBeginningOfLine(state)) {
                _dispatch(_state.tr.replaceSelectionWith(node));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });
            return true;
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );
        };
      }
    });
  }

  const allowedOther = dynamicOther.filter(paletteItem => {
    return !paletteItem.requiredSpacePermission
    || (paletteItem.requiredSpacePermission && userSpacePermissions?.[paletteItem.requiredSpacePermission]);
  });

  const groupConfig = {
    ...paletteGroupItemsRecord,
    other: [
      ...paletteGroupItemsRecord.other,
      ...allowedOther
    ]
  };

  const paletteItems = useMemo(() => {
    const itemGroups = sortedGroupList.map(group => {
      return groupConfig[group].map(paletteItem => PaletteItem.create({
        ...paletteItem,
        group
      }));
    });
    return itemGroups.flat();
  }, [addNestedPage]);

  return paletteItems;
}

function isAtBeginningOfLine (state: EditorState) {
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const parentOffset = state.selection.$cursor.parentOffset;
  return parentOffset === 0;
}
