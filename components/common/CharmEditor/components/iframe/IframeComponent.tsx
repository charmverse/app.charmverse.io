import { useState, memo } from 'react';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractTweetAttrs } from '../tweet/tweetSpec';
import { extractYoutubeLinkType } from '../video/utils';

import type { EmbedType } from './config';
import { embeds, MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from './config';
import { extractEmbedType } from './utils';

type IframeAttrs = {
  src?: string;
  type: EmbedType;
  height: number;
  width: number;
};

function ResizableIframe({ readOnly, node, getPos, view, deleteNode, updateAttrs, onResizeStop }: CharmNodeViewProps) {
  const attrs = node.attrs as IframeAttrs;

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
        icon={<config.icon fontSize='small' />}
        buttonText={config.text}
        onDelete={deleteNode}
      >
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
      </MediaSelectionPopup>
    );
  }

  const figmaSrc = `https://www.figma.com/embed?embed_host=charmverse&url=${attrs.src}`;
  const src = attrs.type === 'figma' ? figmaSrc : attrs.src;

  if (readOnly) {
    return (
      <IframeContainer>
        <iframe
          allowFullScreen
          title='iframe'
          src={src}
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
            src={src}
            style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
          />
        </IframeContainer>
      </VerticalResizer>
    </BlockAligner>
  );
}

export default memo(ResizableIframe);
