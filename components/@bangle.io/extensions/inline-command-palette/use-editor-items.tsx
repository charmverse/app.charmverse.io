import {
  bulletList, orderedList,
  paragraph
} from '@bangle.dev/base-components';
import { queryIsHeadingActive, toggleHeading } from '@bangle.dev/base-components/dist/heading';
import { chainCommands, EditorState, setBlockType, Transaction } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import { useMemo } from 'react';
import { replaceSuggestionMarkWith } from '../../js-lib/inline-palette';
import {
  isList
} from './commands';
import { palettePluginKey } from './config';
import { PaletteItem } from './palette-item';

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

export function useEditorItems() {
  const baseItem = useMemo(
    () => [
      PaletteItem.create({
        uid: 'paraConvert',
        title: 'Paragraph',
        group: 'paragraph',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
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
      }),

      PaletteItem.create({
        uid: 'bulletListConvert',
        title: 'Bullet List',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} version="1.1" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M6 1h10v2h-10v-2zM6 7h10v2h-10v-2zM6 13h10v2h-10v-2zM0 2c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2s-2-0.895-2-2zM0 8c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2s-2-0.895-2-2zM0 14c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2s-2-0.895-2-2z" /></svg>,
        group: 'list',
        keywords: ['unordered', 'lists'],
        description: 'Convert the current block to bullet list',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            if (queryIsHeadingActive(1)(state) || queryIsHeadingActive(2)(state) || queryIsHeadingActive(3)(state)) {
              rafCommandExec(view!, chainCommands(toggleHeading(), toggleBulletList()));
            } else {
              rafCommandExec(view!, chainCommands(toggleBulletList()));
            }
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      }),

      PaletteItem.create({
        uid: 'todoListConvert',
        title: 'Todo List',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M7 7V3a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4v3.993c0 .556-.449 1.007-1.007 1.007H3.007A1.006 1.006 0 0 1 2 20.993l.003-12.986C2.003 7.451 2.452 7 3.01 7H7zm2 0h6.993C16.549 7 17 7.449 17 8.007V15h3V4H9v3zm-.497 11l5.656-5.657-1.414-1.414-4.242 4.243L6.38 13.05l-1.414 1.414L8.503 18z" /></g></svg>,
        group: 'list',
        keywords: ['todo', 'lists', 'checkbox', 'checked'],
        description: 'Convert the current block to todo list',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            if (queryIsHeadingActive(1)(state) || queryIsHeadingActive(2)(state) || queryIsHeadingActive(3)(state)) {
              rafCommandExec(view!, chainCommands(toggleHeading(), toggleTodoList()));
            } else {
              rafCommandExec(view!, chainCommands(toggleTodoList()));
            }
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      }),

      PaletteItem.create({
        uid: 'orderedListConvert',
        group: 'list',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} version="1.1" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M6 13h10v2h-10zM6 7h10v2h-10zM6 1h10v2h-10zM3 0v4h-1v-3h-1v-1zM2 8.219v0.781h2v1h-3v-2.281l2-0.938v-0.781h-2v-1h3v2.281zM4 11v5h-3v-1h2v-1h-2v-1h2v-1h-2v-1z" /></svg>,
        title: 'Ordered List',
        keywords: ['numbered', 'lists'],
        description: 'Convert the current block to ordered list',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            if (queryIsHeadingActive(1)(state) || queryIsHeadingActive(2)(state) || queryIsHeadingActive(3)(state)) {
              rafCommandExec(view!, chainCommands(toggleHeading(), toggleOrderedList()));
            } else {
              rafCommandExec(view!, chainCommands(toggleOrderedList()));
            }
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      }),

      /* PaletteItem.create({
        uid: 'insertSiblingListBelow',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
        group: 'editor',
        title: 'Insert List below',
        keywords: ['insert', 'lists'],
        description: 'Insert a list item',
        disabled: (state) => {
          return !isList()(state);
        },
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, insertEmptySiblingListBelow());
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      }), */

      ...Array.from({ length: 3 }, (_, i) => {
        const level = i + 1;
        return PaletteItem.create({
          uid: 'headingConvert' + level,
          icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z" /></svg>,
          title: 'Heading ' + level,
          group: 'heading',
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
        });
      }),
    ],
    [],
  );

  return baseItem;
}