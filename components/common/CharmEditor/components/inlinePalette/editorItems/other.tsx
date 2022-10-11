
import { rafCommandExec } from '@bangle.dev/utils';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import type { PageType } from '@prisma/client';
import type { PluginKey } from 'prosemirror-state';

import type { SpacePermissionFlags } from 'lib/permissions/spaces';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import type { NestedPagePluginState } from '../../nestedPage';
import { nestedPageSuggestMarkName } from '../../nestedPage';
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

export function items (props: ItemsProps): PaletteItemTypeNoGroup[] {

  const { addNestedPage, disableNestedPage, nestedPagePluginKey, userSpacePermissions, pageType } = props;
  const dynamicOtherItems: PaletteItemTypeNoGroup[] = [
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
      keywords: ['divider', 'hr'],
      icon: <HorizontalRuleIcon sx={{ fontSize: 16 }} />,
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
    }
  ];

  if (pageType !== 'card_template' && !disableNestedPage) {
    dynamicOtherItems.push({
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
    });
  }

  dynamicOtherItems.push(
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
  );

  const allowedDynamicOtherItems = dynamicOtherItems.filter(paletteItem => {
    return !paletteItem.requiredSpacePermission
    || (paletteItem.requiredSpacePermission && userSpacePermissions?.[paletteItem.requiredSpacePermission]);
  });

  return allowedDynamicOtherItems;
}
