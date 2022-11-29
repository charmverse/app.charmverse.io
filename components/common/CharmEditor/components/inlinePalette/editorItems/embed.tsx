import { rafCommandExec } from '@bangle.dev/utils';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import PreviewIcon from '@mui/icons-material/Preview';
import TwitterIcon from '@mui/icons-material/Twitter';
import { FiFigma } from 'react-icons/fi';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT } from 'lib/embed/constants';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

const iconSize = 30;

export function items(): PaletteItemTypeNoGroup[] {
  return [
    {
      uid: 'embed',
      title: 'Embed',
      icon: <PreviewIcon sx={{ fontSize: iconSize }} />,
      keywords: ['iframe'],
      description: 'Insert an embed block',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              // let the node view know to show the tooltip by default
              const tooltipMark = _state.schema.mark('tooltip-marker');
              const node = _state.schema.nodes.iframe.create(
                {
                  src: null,
                  type: 'embed',
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
    },
    {
      uid: 'figma',
      title: 'Figma',
      icon: <FiFigma style={{ fontSize: iconSize }} />,
      keywords: ['iframe'],
      description: 'Embed Figma',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              const node = _state.schema.nodes.iframe.create({
                src: null,
                type: 'figma',
                width: MAX_EMBED_WIDTH,
                height: MIN_EMBED_HEIGHT
              });

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });
            return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
          }
          return false;
        };
      }
    },
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
