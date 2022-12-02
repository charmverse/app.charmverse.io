import { Box } from '@mui/material';
import { useState, memo } from 'react';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractTweetAttrs } from '../tweet/tweetSpec';
import { extractYoutubeLinkType } from '../video/utils';

import type { IframeNodeAttrs, EmbedType } from './config';
import { embeds, MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from './config';
import { convertFigmaToEmbedUrl, convertAirtableToEmbedUrl, extractEmbedType } from './utils';

function IframeComponent({ readOnly, node, getPos, view, deleteNode, updateAttrs, onResizeStop }: CharmNodeViewProps) {
  const attrs = node.attrs as IframeNodeAttrs;

  const [height, setHeight] = useState(attrs.height);

  // If there are no source for the node, return the image select component
  if (!attrs.src) {
    if (readOnly) {
      return <div />;
    }
    const config = embeds[attrs.type as EmbedType] || embeds.embed;

    return (
      <MediaSelectionPopup
        node={node}
        icon={<config.icon style={{ fontSize: 20 }} />}
        buttonText={config.text}
        onDelete={deleteNode}
      >
        <Box py={3}>
          <MediaUrlInput
            onSubmit={(urlToEmbed) => {
              const tweetAttrs = extractTweetAttrs(urlToEmbed);
              const isYoutube = extractYoutubeLinkType(urlToEmbed);
              if (isYoutube) {
                const pos = getPos();
                const _node = view.state.schema.nodes.video.createAndFill({ src: urlToEmbed });
                view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
              } else if (tweetAttrs) {
                const pos = getPos();
                const _node = view.state.schema.nodes.tweet.createAndFill(tweetAttrs);
                view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
              } else {
                const embedType = extractEmbedType(urlToEmbed);
                updateAttrs({
                  src: urlToEmbed,
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

  let embeddableSrc = attrs.src;
  if (attrs.type === 'figma') {
    embeddableSrc = convertFigmaToEmbedUrl(attrs.src);
  } else if (attrs.type === 'airtable') {
    embeddableSrc = convertAirtableToEmbedUrl(attrs.src);
  }

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
