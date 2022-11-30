import type { RawSpecs } from '@bangle.dev/core';
import PreviewIcon from '@mui/icons-material/Preview';
import type { Node } from 'prosemirror-model';
import { useState, memo } from 'react';
import { FiFigma } from 'react-icons/fi';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from 'lib/embed/constants';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';

import BlockAligner from '../BlockAligner';
import { EmbeddedInputPopup } from '../common/EmbeddedInputPopup';
import { EmbeddedUrl } from '../common/EmbeddedUrl';
import { IframeContainer } from '../common/IframeContainer';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractTweetAttrs } from '../tweet/tweetSpec';
import { extractYoutubeLinkType } from '../video/videoSpec';

function ResizableIframe({ readOnly, node, getPos, view, deleteNode, updateAttrs, onResizeStop }: CharmNodeViewProps) {
  const [height, setHeight] = useState(node.attrs.height);
  const figmaSrc = `https://www.figma.com/embed?embed_host=charmverse&url=${node.attrs.src}`;

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    if (readOnly) {
      return <div />;
    }
    let embedIcon = <PreviewIcon fontSize='small' />;
    let embedText = 'Insert an embed';
    if (node.attrs.type === 'figma') {
      embedIcon = <FiFigma fontSize='small' />;
      embedText = 'Insert a Figma embed';
    }
    return (
      <EmbeddedInputPopup node={node} embedIcon={embedIcon} embedText={embedText}>
        <EmbeddedUrl
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
              const attrs = extractEmbedLink(urlToEmbed);
              updateAttrs({
                src: attrs.url,
                type: attrs.type
              });
            }
          }}
          placeholder={node.attrs.type === 'figma' ? 'https://www.figma.com/file...' : 'https://...'}
        />
      </EmbeddedInputPopup>
    );
  }

  if (readOnly) {
    const src = node.attrs.type === 'figma' ? figmaSrc : node.attrs.src;
    return (
      <IframeContainer>
        <iframe
          allowFullScreen
          title='iframe'
          src={src}
          style={{ height: node.attrs.height ?? MIN_EMBED_HEIGHT, border: '0 solid transparent', width: '100%' }}
        />
      </IframeContainer>
    );
  }

  if (node.attrs.type === 'figma') {
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
          width={node.attrs.width}
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
              src={figmaSrc}
              style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
            />
          </IframeContainer>
        </VerticalResizer>
      </BlockAligner>
    );
  } else {
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
          width={node.attrs.width}
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
              src={node.attrs.src}
              style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
            />
          </IframeContainer>
        </VerticalResizer>
      </BlockAligner>
    );
  }
}

export default memo(ResizableIframe);
