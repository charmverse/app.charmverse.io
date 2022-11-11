
import type { EditorState, Transaction } from '@bangle.dev/pm';
import { Fragment, setBlockType } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import DatabaseIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import type { PageType, SpaceOperation } from '@prisma/client';
import { TextSelection } from 'prosemirror-state';
import type { PluginKey } from 'prosemirror-state';

import type { SpacePermissionFlags } from 'lib/permissions/spaces';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import * as bulletList from '../../bulletList';
import { nestedPageSuggestMarkName } from '../../nestedPage/nestedPage.constants';
import type { NestedPagePluginState } from '../../nestedPage/nestedPage.interfaces';
import * as orderedList from '../../orderedList';
import paragraph from '../../paragraph';
import { isList } from '../commands';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup, PromisedCommand } from '../paletteItem';

interface ItemsProps {
  addNestedPage: () => Promise<void>;
  disableNestedPage: boolean;
  nestedPagePluginKey?: PluginKey<NestedPagePluginState>;
  userSpacePermissions?: SpacePermissionFlags;
  pageType?: PageType;
}

const iconSize = 30;

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

export function items (props: ItemsProps): PaletteItemTypeNoGroup[] {
  const { addNestedPage, disableNestedPage, nestedPagePluginKey, pageType, userSpacePermissions } = props;

  const insertPageItem = pageType !== 'card_template' && !disableNestedPage ? [{
    uid: 'insert-page',
    title: 'Insert page',
    requiredSpacePermission: 'createPage' as SpaceOperation,
    keywords: ['page'],
    icon: <DescriptionOutlinedIcon sx={{
      fontSize: iconSize
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
  }] : [];

  const paletteItems: PaletteItemTypeNoGroup[] = [
    {
      uid: 'paraConvert',
      keywords: ['paragraph', 'text'],
      title: 'Text',
      icon: <TextFieldsIcon sx={{
        fontSize: iconSize
      }}
      />,
      description: 'Create a plain text block',
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
    ...insertPageItem,
    {
      uid: 'todoListConvert',
      title: 'Todo List',
      icon: <LibraryAddCheckIcon sx={{
        fontSize: iconSize
      }}
      />,
      keywords: ['todo', 'lists', 'checkbox', 'checked'],
      description: 'Create a todo list',
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
    ...Array.from({ length: 3 }, (_, i) => {
      const level = i + 1;
      return {
        uid: `headingConvert${level}`,
        icon: <svg stroke='currentColor' fill='currentColor' strokeWidth={0} viewBox='0 0 512 512' height={iconSize} width={iconSize} xmlns='http://www.w3.org/2000/svg'><path d='M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z' /></svg>,
        title: `Heading ${level}`,
        description: `Create a heading level ${level}`,
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
      } as PaletteItemTypeNoGroup;
    }),
    {
      uid: 'insertSimpleTable',
      icon: <DatabaseIcon sx={{
        fontSize: iconSize
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
    {
      uid: 'bulletListConvert',
      title: 'Bulleted List',
      icon: <FormatListBulletedIcon sx={{
        fontSize: iconSize
      }}
      />,
      keywords: ['unordered', 'lists'],
      description: 'Create a simple bulleted list',
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
      uid: 'orderedListConvert',
      icon: <FormatListNumberedIcon sx={{
        fontSize: iconSize
      }}
      />,
      title: 'Ordered List',
      keywords: ['numbered', 'lists'],
      description: 'Create an ordered list',
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
    },
    {
      uid: 'insertDisclosure',
      icon: <ArrowForwardIcon sx={{ fontSize: iconSize }} />,
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

              if (tr?.wrap && state.schema.nodes.disclosureDetails) {
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
    },
    {
      uid: 'quote',
      title: 'Quote',
      icon: <ChatOutlinedIcon sx={{
        fontSize: iconSize
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
    {
      uid: 'divider',
      title: 'Divider',
      keywords: ['divider', 'hr'],
      icon: <HorizontalRuleIcon sx={{ fontSize: iconSize }} />,
      description: 'Display horizontal rule',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          // Execute the animation
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.horizontalRule.create({ track: [] });
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
    },
    {
      uid: 'link-to-page',
      title: 'Link to page',
      keywords: ['link', 'page'],
      icon: <DescriptionOutlinedIcon sx={{
        fontSize: iconSize
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
    },
    {
      uid: 'callout',
      title: 'Callout',
      icon: <ChatBubbleIcon sx={{
        fontSize: iconSize
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
    }
  ];

  const allowedDynamicOtherItems = paletteItems.filter(paletteItem => {
    return !paletteItem.requiredSpacePermission
      || (paletteItem.requiredSpacePermission && userSpacePermissions?.[paletteItem.requiredSpacePermission]);
  });

  return allowedDynamicOtherItems;
}
