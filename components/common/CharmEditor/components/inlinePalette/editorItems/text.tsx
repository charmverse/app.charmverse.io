
import type { EditorState, Transaction } from '@bangle.dev/pm';
import { Fragment, setBlockType } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import CodeIcon from '@mui/icons-material/Code';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { TextSelection } from 'prosemirror-state';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import * as bulletList from '../../bulletList';
import * as orderedList from '../../orderedList';
import paragraph from '../../paragraph';
import {
  isList
} from '../commands';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

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

export function items (): PaletteItemTypeNoGroup[] {
  return [
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
      } as PaletteItemTypeNoGroup;
    })
  ];
}
