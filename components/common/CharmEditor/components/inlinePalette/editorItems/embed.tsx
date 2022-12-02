import { rafCommandExec } from '@bangle.dev/utils';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import TwitterIcon from '@mui/icons-material/Twitter';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import type { EmbedType } from '../../iframe/config';
import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, embeds } from '../../iframe/config';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

const iconSize = 30;

function iframeEmbedType(type: EmbedType): PaletteItemTypeNoGroup {
  const Icon = embeds[type].icon;

  return {
    uid: type,
    title: embeds[type].name,
    icon: <Icon style={{ fontSize: iconSize }} />,
    keywords: ['iframe'],
    description: embeds[type].text,
    editorExecuteCommand: () => {
      return (state, dispatch, view) => {
        if (view) {
          rafCommandExec(view, (_state, _dispatch) => {
            // let the node view know to show the tooltip by default
            const tooltipMark = _state.schema.mark('tooltip-marker');
            const node = _state.schema.nodes.iframe.create(
              {
                src: null,
                type,
                width: MAX_EMBED_WIDTH,
                height: MIN_EMBED_HEIGHT
              },
              undefined,
              [tooltipMark]
            );

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node, false));
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        }
        return false;
      };
    }
  };
}

export function items(): PaletteItemTypeNoGroup[] {
  return [
    iframeEmbedType('embed'),
    iframeEmbedType('airtable'),
    iframeEmbedType('figma'),
    {
      uid: 'price',
      title: 'Crypto price',
      icon: <InsertChartIcon sx={{ fontSize: iconSize }} />,
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
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'tweet',
      title: 'Tweet',
      keywords: ['twitter', 'elon'],
      icon: <TwitterIcon sx={{ fontSize: iconSize }} />,
      description: 'Embed a Tweet',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            // Execute the animation
            rafCommandExec(view!, (_state, _dispatch) => {
              // let the node view know to show the tooltip by default
              const tooltipMark = _state.schema.mark('tooltip-marker');
              const node = _state.schema.nodes.tweet.create(undefined, undefined, [tooltipMark]);

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node, false));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    }
  ];
}
