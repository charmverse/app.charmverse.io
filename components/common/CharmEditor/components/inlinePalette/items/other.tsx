
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { PluginKey } from 'prosemirror-state';
import type { SpacePermissionFlags } from 'lib/permissions/spaces';
import { NestedPagePluginState, nestedPageSuggestMarkName } from '../../nestedPage';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import { PaletteItemTypeNoGroup, PromisedCommand } from '../paletteItem';

interface ItemsProps {
  addNestedPage: () => Promise<void>;
  nestedPagePluginKey?: PluginKey<NestedPagePluginState>;
  userSpacePermissions?: SpacePermissionFlags;
}

export function items ({ addNestedPage, nestedPagePluginKey, userSpacePermissions }: ItemsProps): PaletteItemTypeNoGroup[] {

  const dynamicOtherItems = [
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
  ] as PaletteItemTypeNoGroup[];

  const allowedDynamicOtherItems = dynamicOtherItems.filter(paletteItem => {
    return !paletteItem.requiredSpacePermission
    || (paletteItem.requiredSpacePermission && userSpacePermissions?.[paletteItem.requiredSpacePermission]);
  });

  return allowedDynamicOtherItems;
}
