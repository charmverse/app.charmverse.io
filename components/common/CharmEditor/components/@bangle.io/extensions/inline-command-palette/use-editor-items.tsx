import {
  bulletList, orderedList,
  paragraph
} from '@bangle.dev/base-components';
import { EditorState, Fragment, Node, setBlockType, Transaction } from '@bangle.dev/pm';
import { TextSelection } from 'prosemirror-state';
import { rafCommandExec, safeInsert } from '@bangle.dev/utils';
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
import PreviewIcon from '@mui/icons-material/Preview';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { renderSuggestionsTooltip } from 'components/common/CharmEditor/components/@bangle.dev/tooltip/suggest-tooltip';
import { NestedPagePluginKey } from 'components/common/CharmEditor/components/NestedPage';
import useNestedPage from 'hooks/useNestedPage';
import { MIN_EMBED_WIDTH, MAX_EMBED_WIDTH, VIDEO_ASPECT_RATIO, MIN_EMBED_HEIGHT } from 'lib/embed/constants';
import { useMemo } from 'react';
import { replaceSuggestionMarkWith } from '../../js-lib/inline-palette';
import {
  isList
} from './commands';
import { palettePluginKey } from './config';
import { PaletteItem, PaletteItemType, PromisedCommand } from './palette-item';

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

function createTableCell(state: EditorState, text: string) {
  return state.schema.nodes.table_cell.create(undefined, Fragment.fromArray([
    state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
      state.schema.text(text)
    ]))
  ]))
}

function createTableHeader(state: EditorState, text: string) {
  return state.schema.nodes.table_header.create(undefined, Fragment.fromArray([
    state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
      state.schema.text(text)
    ]))
  ]))
}

export function insertNode(state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, nodeToInsert: Node) {
  const insertPos = state.selection.$from.after();

  const tr = state.tr;
  const newTr = safeInsert(nodeToInsert, insertPos)(state.tr);

  if (tr === newTr) {
    return false;
  }

  if (dispatch) {
    dispatch(newTr.scrollIntoView());
  }

  return true;
}

function createColumnPaletteItem(colCount: number): Omit<PaletteItemType, "group"> {
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
          rafCommandExec(view!, (state, dispatch) => {

            const columnBlocks: Node[] = [];
            for (let index = 0; index < colCount; index++) {
              columnBlocks.push(
                state.schema.nodes.columnBlock.create(undefined, Fragment.fromArray([
                  state.schema.nodes.paragraph.create()
                ]))
              )
            }

            const node = state.schema.nodes.columnLayout.create(
              undefined,
              Fragment.fromArray(columnBlocks)
            );

            if (dispatch && isAtBeginningOfLine(state)) {
              let tr = state.tr;
              const offset = tr.selection.anchor;
              tr = tr.replaceSelectionWith(node);

              // move cursor to first column
              const resolvedPos = tr.doc.resolve(offset);
              tr.setSelection(TextSelection.near(resolvedPos));

              dispatch(tr);
              return true;
            }
            return insertNode(state, dispatch, node)
          })
        }
        return replaceSuggestionMarkWith(palettePluginKey, '')(
          state,
          dispatch,
          view,
        );
      };
    },
  }
}

const paletteGroupItemsRecord: Record<string, Omit<PaletteItemType, "group">[]> = {
  other: [
    {
      uid: 'price',
      title: 'Crypto price',
      icon: <InsertChartIcon sx={{ fontSize: 16 }}
      />,
      description: 'Display a crypto price',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            // Execute the animation
            rafCommandExec(view!, (state, dispatch) => {

              const node = state.schema.nodes.cryptoPrice.create();

              if (dispatch && isAtBeginningOfLine(state)) {
                dispatch(state.tr.replaceSelectionWith(node));
                return true;
              }
              return insertNode(state, dispatch, node)
            })
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );

        };
      },
    },
    {
      uid: 'horizontal_rule',
      title: 'Horizontal Rule',
      icon: <HorizontalRuleIcon sx={{ fontSize: 16 }}
      />,
      description: 'Display horizontal rule',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          // Execute the animation
          rafCommandExec(view!, (state, dispatch) => {
            const node = state.schema.nodes.horizontalRule.create();
            if (dispatch && isAtBeginningOfLine(state)) {
              dispatch(state.tr.replaceSelectionWith(node));
              return true;
            }
            return insertNode(state, dispatch, node)
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );

        };
      },
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
          rafCommandExec(view!, (state, dispatch) => {

            const node = state.schema.nodes.image.create({
              src: null
            })

            if (dispatch && isAtBeginningOfLine(state)) {
              dispatch(state.tr.replaceSelectionWith(node));
              return true;
            }

            return insertNode(state, dispatch, node)
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
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
          rafCommandExec(view!, (state, dispatch) => {

            const node = state.schema.nodes.paragraph.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.iframe.create({
                  src: null,
                  type: "video",
                  width: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2,
                  height: ((MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2) / VIDEO_ASPECT_RATIO
                })
              ])
            )

            if (dispatch && isAtBeginningOfLine(state)) {
              dispatch(state.tr.replaceSelectionWith(node));
              return true;
            }

            return insertNode(state, dispatch, node)
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'embed',
      title: 'Embed',
      icon: <PreviewIcon sx={{fontSize: 16}}/>,
      keywords: ['iframe'],
      description: 'Insert an embed block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {

            const node = state.schema.nodes.paragraph.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.iframe.create({
                  src: null,
                  type: "embed",
                  width: MAX_EMBED_WIDTH,
                  height: MIN_EMBED_HEIGHT
                })
              ])
            )

            if (dispatch && isAtBeginningOfLine(state)) {
              dispatch(state.tr.replaceSelectionWith(node));
              return true;
            }
            return insertNode(state, dispatch, node)
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'insertSimpleTable',
      icon: <TableChartIcon sx={{
        fontSize: 16
      }}/>,
      title: 'Table',
      keywords: ['table'],
      description: 'Insert a simple table below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            return insertNode(state, dispatch, state.schema.nodes.table.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                  createTableHeader(state, "Header 1"),
                  createTableHeader(state, "Header 2"),
                  createTableHeader(state, "Header 3"),
                ])),
                state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                  createTableCell(state, "Cell 1"),
                  createTableCell(state, "Cell 2"),
                  createTableCell(state, "Cell 3"),
                ]))
              ])
            ))
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    createColumnPaletteItem(2),
    createColumnPaletteItem(3),
  ],
  text: [
    {
      uid: 'paraConvert',
      keywords: ['paragraph', 'text'],
      title: 'Text',
      icon: <TextFieldsIcon sx={{
        fontSize: 16
      }}/>,
      description: 'Convert the current block to paragraph',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            if (queryIsTodoListActive()(state)) {
              return toggleTodoList()(state, dispatch, view);
            }
            if (queryIsBulletListActive()(state)) {
              return toggleBulletList()(state, dispatch, view);
            }
            if (queryIsOrderedListActive()(state)) {
              return toggleOrderedList()(state, dispatch, view);
            }
            return convertToParagraph()(state, dispatch, view);
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'code',
      title: 'Code',
      icon: <CodeIcon sx={{
        fontSize: 16
      }}/>,
      description: 'Insert a code block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (state, dispatch) => {
              if (isAtBeginningOfLine(state)) {
                return setBlockType(state.schema.nodes.codeBlock, { language: 'Javascript' })(state, dispatch);
              }
              return insertNode(state, dispatch, state.schema.nodes.codeBlock.create(
                { language: "Javascript" },
                Fragment.fromArray([])
              ))
            })
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'callout',
      title: 'Callout',
      icon: <ChatBubbleIcon sx={{
        fontSize: 16
      }}/>,
      description: 'Insert a callout block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {

            const node = state.schema.nodes.blockquote.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
                ]))
              ])
            )

            if (dispatch && isAtBeginningOfLine(state)) {
              dispatch(state.tr.replaceSelectionWith(node));
              return true;
            }
            return insertNode(state, dispatch, node)
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'quote',
      title: 'Quote',
      icon: <ChatOutlinedIcon sx={{
        fontSize: 16
      }}/>,
      description: 'Insert a quote in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {

            const node = state.schema.nodes.quote.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.paragraph.create()
              ])
            )

            if (dispatch && isAtBeginningOfLine(state)) {
              dispatch(state.tr.replaceSelectionWith(node));
              return true;
            }
            return insertNode(state, dispatch, node)
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    ...Array.from({ length: 3 }, (_, i) => {
      const level = i + 1;
      return {
        uid: 'headingConvert' + level,
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z" /></svg>,
        title: 'Heading ' + level,
        description: 'Convert the current block to heading level ' + level,
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
              view,
            );
          };
        },
      } as Omit<PaletteItemType, "group">;
    })
  ],
  "list": [
    {
      uid: 'bulletListConvert',
      title: 'Bullet List',
      icon: <FormatListBulletedIcon sx={{
        fontSize: 16
      }}/>,
      keywords: ['unordered', 'lists'],
      description: 'Convert the current block to bullet list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            setBlockType(state.schema.nodes.paragraph)(state, dispatch);
            return toggleBulletList()(view!.state, view!.dispatch, view);
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'todoListConvert',
      title: 'Todo List',
      icon: <LibraryAddCheckIcon sx={{
        fontSize: 16
      }}/>,
      keywords: ['todo', 'lists', 'checkbox', 'checked'],
      description: 'Convert the current block to todo list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            setBlockType(state.schema.nodes.paragraph)(state, dispatch);
            return toggleTodoList()(view!.state, view!.dispatch, view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'orderedListConvert',
      icon: <FormatListNumberedIcon sx={{
        fontSize: 16
      }}/>,
      title: 'Ordered List',
      keywords: ['numbered', 'lists'],
      description: 'Convert the current block to ordered list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            setBlockType(state.schema.nodes.paragraph)(state, dispatch);
            return toggleOrderedList()(view!.state, view!.dispatch, view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    }
  ]
};


export function useEditorItems() {
  const { addNestedPage } = useNestedPage()

  const paletteItems = useMemo(() => {
    const paletteItems: PaletteItem[] = [];
    Object.entries({...paletteGroupItemsRecord, other: [
      ...paletteGroupItemsRecord.other,
      {
        uid: 'insert-page',
        title: 'Insert page',
        icon: <DescriptionOutlinedIcon sx={{
          fontSize: 16
        }}/>,
        description: 'Insert a new page',
        editorExecuteCommand: (() => {
          return (async (state, dispatch, view) => {
            await addNestedPage();
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          }) as PromisedCommand;
        }),
      },
      {
        uid: 'link-to-page',
        title: 'Link to page',
        icon: <DescriptionOutlinedIcon sx={{
          fontSize: 16
        }}/>,
        description: 'Link to a new page',
        editorExecuteCommand: (() => {
          return (async (state, dispatch, view) => {
            renderSuggestionsTooltip(NestedPagePluginKey)(state, dispatch, view);
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view
            );
          }) as PromisedCommand;
        }),
      }
    ]}).forEach(([group, paletteItemsWithoutGroup]) => {
      paletteItemsWithoutGroup.forEach(paletteItem => {
        paletteItems.push(PaletteItem.create({
          ...paletteItem,
          group
        }))
      })
    })
    return paletteItems;
  }, [addNestedPage]);

  return paletteItems;
}

function isAtBeginningOfLine (state: EditorState) {
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const parentOffset = state.selection.$cursor.parentOffset;
  return parentOffset === 0;
}