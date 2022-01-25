import {
  bulletList,
  listItem,
  orderedList,
  paragraph
} from '@bangle.dev/base-components';
import { EditorState, setBlockType, Transaction } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import { useMemo } from 'react';
import { replaceSuggestionMarkWith } from '../../js-lib/inline-palette';
import {
  chainedInsertParagraphBelow,
  isList
} from './commands';
import { palettePluginKey } from './config';
import { PaletteItem } from './palette-item';

const { convertToParagraph } = paragraph;
const {
  toggleBulletList,
  toggleTodoList,
  queryIsBulletListActive,
  queryIsTodoListActive,
} = bulletList;
const { insertEmptySiblingListBelow } = listItem;
const { toggleOrderedList, queryIsOrderedListActive } = orderedList;

const setHeadingBlockType = (level: number) => (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined) => {
  const type = state.schema.nodes.heading;
  return setBlockType(type, { level })(state, dispatch);
};

export function useEditorItems() {
  const baseItem = useMemo(
    () => [
      PaletteItem.create({
        uid: 'paraBelow',
        title: 'Insert paragraph',
        group: 'editor',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
        description: 'Inserts a new paragraph',
        // TODO current just disabling it, but we need to implement this method for lists
        disabled: (state) => {
          return isList()(state);
        },
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, chainedInsertParagraphBelow());
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      }),

      PaletteItem.create({
        uid: 'paraConvert',
        title: 'Paragraph',
        group: 'editor',
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
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
        group: 'editor',
        keywords: ['unordered', 'lists'],
        description: 'Convert the current block to bullet list',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, toggleBulletList());
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
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
        group: 'editor',
        keywords: ['todo', 'lists', 'checkbox', 'checked'],
        description: 'Convert the current block to todo list',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, toggleTodoList());
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
        group: 'editor',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
        title: 'Ordered List',
        keywords: ['numbered', 'lists'],
        description: 'Convert the current block to ordered list',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, toggleOrderedList());
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      }),

      PaletteItem.create({
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
      }),

      ...Array.from({ length: 3 }, (_, i) => {
        const level = i + 1;
        return PaletteItem.create({
          uid: 'headingConvert' + level,
          icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h2v4h2V6h2v14h2V6h3V4H9c-3.309 0-6 2.691-6 6s2.691 6 6 6zM9 6h2v8H9c-2.206 0-4-1.794-4-4s1.794-4 4-4z" /></svg>,
          title: 'H' + level,
          group: 'editor',
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