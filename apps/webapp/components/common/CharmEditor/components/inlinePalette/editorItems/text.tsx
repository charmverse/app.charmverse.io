import { Fragment, setBlockType, findWrapping } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import type { PageType } from '@charmverse/core/prisma';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import DatabaseIcon from '@mui/icons-material/TableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { commands as listItemCommands } from '@packages/charmeditor/extensions/listItem';
import type { EditorState, Transaction, PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';

import type { SpacePermissionFlags } from '@packages/lib/permissions/spaces';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { linkedPageSuggestMarkName } from '../../linkedPage/linkedPage.constants';
import type { NestedPagePluginState } from '../../nestedPage/nestedPage.interfaces';
import { convertToParagraph } from '../../paragraph/paragraph';
import { isList } from '../commands';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup, PromisedCommand } from '../paletteItem';

interface ItemsProps {
  addNestedPage: () => Promise<void>;
  disableNestedPage: boolean;
  linkedPagePluginKey?: PluginKey<NestedPagePluginState>;
  userSpacePermissions?: SpacePermissionFlags;
  pageType?: PageType;
}

const iconSize = 30;

function createTableCell(state: EditorState, text: string) {
  return state.schema.nodes.table_cell.create(
    undefined,
    Fragment.fromArray([state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([state.schema.text(text)]))])
  );
}

function createTableHeader(state: EditorState, text: string) {
  return state.schema.nodes.table_header.create(
    undefined,
    Fragment.fromArray([state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([state.schema.text(text)]))])
  );
}

const {
  toggleTodoList,
  queryIsBulletListActive,
  queryIsTodoListActive,
  toggleBulletList,
  toggleOrderedList,
  queryIsOrderedListActive
} = listItemCommands;

const setHeadingBlockType =
  (level: number) => (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined) => {
    const type = state.schema.nodes.heading;
    return setBlockType(type, { level })(state, dispatch);
  };

export function items(props: ItemsProps): PaletteItemTypeNoGroup[] {
  const { addNestedPage, disableNestedPage, linkedPagePluginKey, pageType, userSpacePermissions } = props;

  const insertPageItem: PaletteItemTypeNoGroup[] =
    pageType !== 'card_template' && !disableNestedPage
      ? [
          {
            uid: 'insert-page',
            title: 'Insert page',
            keywords: ['page', 'nested'],
            icon: (
              <DescriptionOutlinedIcon
                sx={{
                  fontSize: iconSize
                }}
              />
            ),
            description: 'Insert a new page',
            editorExecuteCommand: ({ palettePluginKey }) => {
              return (async (state, dispatch, view) => {
                await addNestedPage();
                return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
              }) as PromisedCommand;
            }
          }
        ]
      : [];

  const paletteItems: PaletteItemTypeNoGroup[] = [
    {
      uid: 'paraConvert',
      keywords: ['paragraph', 'text'],
      title: 'Text',
      icon: (
        <TextFieldsIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Create a plain text block',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
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

          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    ...insertPageItem,
    {
      uid: 'todoListConvert',
      title: 'Todo List',
      icon: (
        <LibraryAddCheckIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      keywords: ['todo', 'lists', 'checkbox', 'checked'],
      description: 'Create a todo list',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            setBlockType(_state.schema.nodes.paragraph)(_state, _dispatch);
            return toggleTodoList()(_view!.state, _view!.dispatch, _view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    ...Array.from({ length: 3 }, (_, i) => {
      const level = i + 1;
      return {
        uid: `headingConvert${level}`,
        icon: (
          <svg
            stroke='currentColor'
            fill='currentColor'
            strokeWidth={0}
            viewBox='0 0 512 512'
            height={iconSize}
            width={iconSize}
            xmlns='http://www.w3.org/2000/svg'
          >
            <path d='M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z' />
          </svg>
        ),
        title: `Heading ${level}`,
        keywords: [`h${level}`],
        description: `Create a heading level ${level}`,
        showInFloatingMenu: true,
        disabled: (state) => {
          const result = isList()(state);
          return result;
        },
        editorExecuteCommand: ({ palettePluginKey }) => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, setHeadingBlockType(level));
            return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
          };
        }
      } as PaletteItemTypeNoGroup;
    }),
    {
      uid: 'insertSimpleTable',
      icon: (
        <DatabaseIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      title: 'Table',
      keywords: ['table'],
      description: 'Insert a simple table below',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.table.create(
              undefined,
              Fragment.fromArray([
                _state.schema.nodes.table_row.create(
                  undefined,
                  Fragment.fromArray([
                    createTableHeader(_state, 'Header 1'),
                    createTableHeader(_state, 'Header 2'),
                    createTableHeader(_state, 'Header 3')
                  ])
                ),
                _state.schema.nodes.table_row.create(
                  undefined,
                  Fragment.fromArray([
                    createTableCell(_state, 'Cell 1'),
                    createTableCell(_state, 'Cell 2'),
                    createTableCell(_state, 'Cell 3')
                  ])
                )
              ])
            );
            if (_dispatch) {
              _dispatch(_state.tr.replaceSelectionWith(node));
              return true;
            }

            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'bulletListConvert',
      title: 'Bulleted List',
      icon: (
        <FormatListBulletedIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      keywords: ['unordered', 'lists'],
      description: 'Create a simple bulleted list',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            setBlockType(_state.schema.nodes.paragraph)(_state, _dispatch);
            return toggleBulletList()(_view!.state, _view!.dispatch, _view);
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'orderedListConvert',
      icon: (
        <FormatListNumberedIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      title: 'Ordered List',
      keywords: ['numbered', 'lists'],
      description: 'Create an ordered list',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch, _view) => {
            setBlockType(_state.schema.nodes.paragraph)(_state, _dispatch);
            return toggleOrderedList()(_view!.state, _view!.dispatch, _view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'insertDisclosure',
      icon: <ArrowForwardIcon sx={{ fontSize: iconSize }} />,
      title: 'Toggle List/Heading',
      keywords: ['summary', 'disclosure', 'toggle', 'collapse'],
      description: 'Insert a summary and content',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            const { $from, $to } = _state.selection;
            const range = $from.blockRange($to);

            if (_dispatch && range) {
              const tr = _state.tr;
              const contentNode = range.$from.node();

              if (state.schema.nodes.disclosureDetails) {
                tr.replaceWith(
                  range.start,
                  range.end,
                  _state.schema.nodes.disclosureDetails.createChecked(
                    null,
                    Fragment.fromArray([
                      _state.schema.nodes.disclosureSummary.create(
                        undefined,
                        Fragment.fromArray([contentNode.copy(contentNode.content)])
                      ),
                      _state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([]))
                    ])
                  )
                );
                const resolvedPos = tr.doc.resolve(range.start + 1);

                tr.setSelection(TextSelection.near(resolvedPos));
                _dispatch(tr);
              }
            }
            return true;
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'quote',
      title: 'Quote',
      icon: (
        <ChatOutlinedIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Insert a quote in the line below',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.quote.create(
              undefined,
              Fragment.fromArray([_state.schema.nodes.paragraph.create()])
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
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'divider',
      title: 'Divider',
      keywords: ['divider', 'hr'],
      icon: <HorizontalRuleIcon sx={{ fontSize: iconSize }} />,
      description: 'Display horizontal rule',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          // Execute the animation
          rafCommandExec(view!, (_state, _dispatch) => {
            const node = _state.schema.nodes.horizontalRule.create({ track: [] });
            if (_dispatch) {
              _dispatch(_state.tr.replaceSelectionWith(node));
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'link-to-page',
      title: 'Link to page',
      keywords: ['link', 'page'],
      icon: (
        <DescriptionOutlinedIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Link to an existing page',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (async (state, dispatch, view) => {
          if (linkedPagePluginKey) {
            const nestedPagePluginState = linkedPagePluginKey.getState(state);
            if (nestedPagePluginState) {
              replaceSuggestionMarkWith(
                palettePluginKey,
                state.schema.text(' ', [state.schema.marks[linkedPageSuggestMarkName].create({})]),
                true
              )(state, dispatch, view);
            }
            return false;
          }
          return false;
        }) as PromisedCommand;
      }
    },
    {
      uid: 'callout',
      title: 'Callout',
      icon: (
        <ChatBubbleIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Insert a callout block in the line below',
      showInFloatingMenu: true,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            const { $from } = _state.selection;
            const nodeType = _state.schema.nodes.blockquote;
            const isEmptySelection = _state.selection.empty;
            const node = nodeType.create(
              undefined,
              Fragment.fromArray([_state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([]))])
            );

            if (_dispatch) {
              const tr = _state.tr;
              let wrapping: ReturnType<typeof findWrapping> = null;
              const range = $from.blockRange();
              // if selection is not empty, try to wrap the node(s) with a callout instead of creating a new node
              if (!isEmptySelection) {
                wrapping = range && findWrapping(range, nodeType);
              }
              if (wrapping) {
                tr.wrap(range!, wrapping);
              } else {
                tr.replaceSelectionWith(node);
              }
              // move cursor to block
              const offset = tr.selection.$head.end(1); // param 1 is node deep
              const resolvedPos = tr.doc.resolve(offset);
              tr.setSelection(TextSelection.near(resolvedPos));
              _dispatch(tr);
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'emoji',
      title: 'Emoji',
      icon: (
        <EmojiEmotionsOutlinedIcon
          sx={{
            fontSize: iconSize
          }}
        />
      ),
      description: 'Search for an emoji to place in text',
      showInFloatingMenu: false,
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, () => {
            if (view) {
              const { schema, tr, selection } = view.state;
              const markName = 'emojiSuggest';
              const mark = schema.mark(markName, { trigger: ':' });
              const marks = selection.$from.marks();
              view.dispatch(tr.replaceSelectionWith(schema.text(':', [mark, ...marks]), false));
              return true;
            }
            return true;
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    }
  ];

  const allowedDynamicOtherItems = paletteItems.filter((paletteItem) => {
    // Currently we don't consume this anymore. Leaving it here for future use.
    return (
      !paletteItem.requiredSpacePermission ||
      (paletteItem.requiredSpacePermission && userSpacePermissions?.[paletteItem.requiredSpacePermission])
    );
  });

  return allowedDynamicOtherItems;
}
