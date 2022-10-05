
import { setBlockType } from '@bangle.dev/pm';
import { rafCommandExec } from '@bangle.dev/utils';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';

import * as bulletList from '../../bulletList';
import * as orderedList from '../../orderedList';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

const {
  toggleTodoList,
  toggleBulletList
} = bulletList;
const { toggleOrderedList } = orderedList;

export function items (): PaletteItemTypeNoGroup[] {
  return [
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
  ];
}
