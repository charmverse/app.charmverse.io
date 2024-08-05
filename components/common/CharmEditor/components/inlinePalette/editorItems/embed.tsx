import { rafCommandExec } from '@bangle.dev/utils';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import type { PluginKey } from 'prosemirror-state';
import { FaXTwitter } from 'react-icons/fa6';
import { RiNftLine } from 'react-icons/ri';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { EmbedIcon } from '../../iframe/components/EmbedIcon';
import type { Embed, EmbedType } from '../../iframe/config';
import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, embeds } from '../../iframe/config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup, PromisedCommand } from '../paletteItem';

const iconSize = 30;

function iframeEmbedType(type: EmbedType): PaletteItemTypeNoGroup {
  const config = embeds[type] as Embed;
  return {
    uid: type,
    title: config.name,
    icon: <EmbedIcon {...config} size='large' />,
    keywords: ['iframe'].concat(config.keywords || []),
    description: config.text,
    editorExecuteCommand: ({ palettePluginKey }) => {
      return (state, dispatch, view) => {
        if (view) {
          rafCommandExec(view, (_state, _dispatch) => {
            // let the node view know to show the tooltip by default
            const tooltipMark = _state.schema.mark('tooltip-marker');
            let height = MIN_EMBED_HEIGHT;
            if (config.heightRatio) {
              height = Math.round(MAX_EMBED_WIDTH / config.heightRatio);
            }
            const node = _state.schema.nodes.iframe.create(
              {
                src: null,
                type,
                width: MAX_EMBED_WIDTH,
                height
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

function handleCustomEmbed({
  palettePluginKey,
  addTooltipMarker = true,
  nodeName
}: {
  addTooltipMarker?: boolean;
  palettePluginKey: PluginKey;
  nodeName: string;
}): PromisedCommand {
  return (state, dispatch, view) => {
    if (view) {
      // Execute the animation
      rafCommandExec(view!, (_state, _dispatch) => {
        // let the node view know to show the tooltip by default
        const node = addTooltipMarker
          ? _state.schema.nodes[nodeName].create(undefined, undefined, [_state.schema.mark('tooltip-marker')])
          : _state.schema.nodes[nodeName].create();

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

export function items(): PaletteItemTypeNoGroup[] {
  return [
    iframeEmbedType('embed'),
    iframeEmbedType('airtable'),
    iframeEmbedType('dune'),
    iframeEmbedType('figma'),
    iframeEmbedType('google'),
    iframeEmbedType('loom'),
    iframeEmbedType('odysee'),
    iframeEmbedType('typeform'),
    {
      uid: 'farcasterFrame',
      title: 'Frame (Farcaster)',
      keywords: ['frame', 'farcaster'],
      icon: (
        <img
          style={{
            width: 25,
            height: 25
          }}
          src='/images/logos/farcaster_logo_grayscale.png'
        />
      ),
      description: 'Embed a Farcaster Frame',
      editorExecuteCommand: ({ palettePluginKey }) =>
        handleCustomEmbed({
          nodeName: 'farcasterFrame',
          palettePluginKey
        }),
      priority: 1
    },
    {
      uid: 'price',
      title: 'Crypto price',
      icon: <InsertChartIcon sx={{ fontSize: iconSize }} />,
      description: 'Display a crypto price',
      editorExecuteCommand: ({ palettePluginKey }) =>
        handleCustomEmbed({
          nodeName: 'cryptoPrice',
          palettePluginKey,
          addTooltipMarker: false
        })
    },
    {
      uid: 'nft',
      title: 'Blockchain NFT',
      keywords: ['web3', 'opensea'],
      icon: <EmbedIcon icon={RiNftLine} size='large' />,
      description: 'Embed an NFT',
      editorExecuteCommand: ({ palettePluginKey }) =>
        handleCustomEmbed({
          nodeName: 'nft',
          palettePluginKey
        })
    },
    {
      uid: 'tweet',
      title: 'Tweet',
      keywords: ['twitter', 'elon'],
      icon: <FaXTwitter style={{ fontSize: iconSize }} />,
      description: 'Embed a Tweet',
      editorExecuteCommand: ({ palettePluginKey }) =>
        handleCustomEmbed({
          nodeName: 'tweet',
          palettePluginKey
        })
    }
  ];
}
