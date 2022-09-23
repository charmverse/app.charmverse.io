
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { PluginKey } from 'prosemirror-state';
import type { SpacePermissionFlags } from 'lib/permissions/spaces';
import { rafCommandExec } from '@bangle.dev/utils';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import type { PageType } from '@prisma/client';
import dynamic from 'next/dynamic';
import type { PaletteItemTypeNoGroup, PromisedCommand } from '../paletteItem';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import { palettePluginKey } from '../config';
import type { NestedPagePluginState } from '../../nestedPage';
import { nestedPageSuggestMarkName } from '../../nestedPage';
import { insertNode, isAtBeginningOfLine } from '../../../utils';

interface ItemsProps {
  addNestedPage: () => Promise<void>;
  nestedPagePluginKey?: PluginKey<NestedPagePluginState>;
  userSpacePermissions?: SpacePermissionFlags;
  pageType?: PageType;
}

export function items ({ addNestedPage, nestedPagePluginKey, userSpacePermissions, pageType }: ItemsProps): PaletteItemTypeNoGroup[] {
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

  if (pageType !== 'card_template') {
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
