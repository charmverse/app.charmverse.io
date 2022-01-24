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