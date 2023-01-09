import { Box } from '@mui/material';
import { useState, memo } from 'react';

import { extractNftAttrs } from 'lib/nft/extractNftAttrs';
import { extractTweetAttrs } from 'lib/twitter/extractTweetAttrs';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractYoutubeLinkType } from '../video/utils';

import { EmbedIcon } from './components/EmbedIcon';
import type { IframeNodeAttrs, Embed, EmbedType } from './config';
import { embeds, MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from './config';
import { extractEmbedType } from './utils';

function IframeComponent({
  readOnly,
  node,
  getPos,
  view,
  deleteNode,
  selected,
  updateAttrs,
  onResizeStop
}: CharmNodeViewProps) {
  const attrs = node.attrs as IframeNodeAttrs;

  const [height, setHeight] = useState(attrs.height);

  const config = embeds[attrs.type as EmbedType] || embeds.embed;

  // If there are no source for the node, return the image select component
  if (!attrs.src) {
    if (readOnly) {
      return <div />;
    }
    return (
      <MediaSelectionPopup
        node={node}
        icon={<EmbedIcon {...config} size='small' />}
        isSelected={selected}
        buttonText={config.text}
        onDelete={deleteNode}
      >
        <Box py={3}>
          <MediaUrlInput
            onSubmit={(urlToEmbed) => {
              const nftAttrs = extractNftAttrs(urlToEmbed);
              const tweetAttrs = extractTweetAttrs(urlToEmbed);
              const isYoutube = extractYoutubeLinkType(urlToEmbed);
              if (isYoutube) {
                const pos = getPos();
                const _node = view.state.schema.nodes.video.createAndFill({ src: urlToEmbed });
                if (_node) {
                  view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
                }
              } else if (nftAttrs) {
                const pos = getPos();
                const _node = view.state.schema.nodes.nft.createAndFill(nftAttrs);
                if (_node) {
                  view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
                }
              } else if (tweetAttrs) {
                const pos = getPos();
                const _node = view.state.schema.nodes.tweet.createAndFill(tweetAttrs);
                if (_node) {
                  view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
                }
              } else {
                const embedType = extractEmbedType(urlToEmbed);
                const newConfig = embeds[embedType] as Embed;
                const width = attrs.width;
                let _height = attrs.height;
                if (width && _height && newConfig.heightRatio) {
                  _height = width / newConfig.heightRatio;
                }
                updateAttrs({
                  src: urlToEmbed,
                  height: _height,
                  type: embedType
                });
              }
            }}
            placeholder={config.placeholder}
          />
        </Box>
      </MediaSelectionPopup>
    );
  }

  const embeddableSrc = (config as Embed).convertURLToEmbed?.(attrs.src) || attrs.src;

  if (readOnly) {
    return (
      <IframeContainer>
        <iframe
          allowFullScreen
          title='iframe'
          src={embeddableSrc}
          style={{ height: attrs.height ?? MIN_EMBED_HEIGHT, border: '0 solid transparent', width: '100%' }}
        />
      </IframeContainer>
    );
  }

  return (
    <BlockAligner onDelete={deleteNode}>
      <VerticalResizer
        onResizeStop={(_, data) => {
          updateAttrs({
            height: data.size.height
          });
          if (onResizeStop) {
            onResizeStop(view);
          }
        }}
        width={attrs.width}
        height={height}
        onResize={(_, data) => {
          setHeight(data.size.height);
        }}
        maxConstraints={[MAX_EMBED_WIDTH, MAX_EMBED_HEIGHT]}
        minConstraints={[MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT]}
      >
        <IframeContainer>
          <iframe
            allowFullScreen
            title='iframe'
            src={embeddableSrc}
            style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
          />
        </IframeContainer>
      </VerticalResizer>
    </BlockAligner>
  );
}

export default memo(IframeComponent);
