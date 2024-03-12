import { memo, useEffect, useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import { isPdfEmbedLink } from 'lib/pdf/extractPdfEmbedLink';
import { isUrl } from 'lib/utils/strings';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import { extractEmbedType, extractIframeProps } from '../iframe/utils';
import { extractAttrsFromUrl as extractNFTAttrs } from '../nft/utils';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import VerticalResizer from '../Resizable/VerticalResizer';
import { extractTweetAttrs } from '../tweet/tweetSpec';
import { extractYoutubeLinkType } from '../video/utils';

import { EmbedIcon } from './components/EmbedIcon';
import type { Embed, EmbedType, IframeNodeAttrs } from './config';
import { embeds, MAX_EMBED_HEIGHT, MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MIN_EMBED_WIDTH } from './config';

function IframeComponent({ readOnly, node, getPos, view, deleteNode, selected, updateAttrs }: CharmNodeViewProps) {
  const attrs = node.attrs as IframeNodeAttrs;

  const [state, setState] = useState({
    width: attrs.width,
    height: attrs.height
  });

  const config = embeds[attrs.type as EmbedType] || embeds.embed;

  useEffect(() => {
    setState({ ...attrs });
  }, [attrs.height, attrs.width]);

  // If there are no source for the node, return the image select component
  if (!attrs.src) {
    if (readOnly) {
      return <div />;
    }
    const inputProps = {
      isValid(userInput: string): boolean {
        return Boolean(extractIframeProps(userInput) || isUrl(userInput));
      },
      onSubmit(urlToEmbed: string) {
        // first extract props from embed code, if possible
        const iframeProps = extractIframeProps(urlToEmbed);
        const parsedUrl = iframeProps?.src || urlToEmbed;
        const nftAttrs = extractNFTAttrs(parsedUrl);
        const tweetAttrs = extractTweetAttrs(parsedUrl);
        const isYoutube = extractYoutubeLinkType(parsedUrl);
        const isPdf = isPdfEmbedLink(parsedUrl);
        if (isYoutube) {
          const pos = getPos();
          const _node = view.state.schema.nodes.video.createAndFill({ src: parsedUrl });
          if (typeof pos === 'number' && _node) {
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
          }
        } else if (isPdf) {
          const pos = getPos();
          const _node = view.state.schema.nodes.pdf.createAndFill({ src: parsedUrl });
          if (typeof pos === 'number' && _node) {
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
          }
        } else if (nftAttrs) {
          const pos = getPos();
          const _node = view.state.schema.nodes.nft.createAndFill(nftAttrs);
          if (typeof pos === 'number' && _node) {
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
          }
        } else if (tweetAttrs) {
          const pos = getPos();
          const _node = view.state.schema.nodes.tweet.createAndFill(tweetAttrs);
          if (typeof pos === 'number' && _node) {
            view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, _node));
          }
        } else {
          const embedType = extractEmbedType(parsedUrl);
          const newConfig = embeds[embedType] as Embed;
          const width = iframeProps?.width ?? attrs.width;
          let height = iframeProps?.height ?? attrs.height;
          if (width && height && newConfig.heightRatio) {
            height = width / newConfig.heightRatio;
          }
          updateAttrs({
            src: parsedUrl,
            height,
            width,
            type: embedType
          });
        }
      }
    };
    return (
      <MediaSelectionPopup
        node={node}
        icon={<EmbedIcon {...config} size='small' />}
        isSelected={selected}
        buttonText={config.text}
        onDelete={deleteNode}
      >
        <MultiTabs
          tabs={[
            ['Link', <MediaUrlInput {...inputProps} key='link' placeholder={config.placeholder} />],
            ['Embed code', <MediaUrlInput {...inputProps} key='embed' multiline={true} placeholder='<iframe...' />]
          ]}
        />
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
    <BlockAligner readOnly={readOnly} onDelete={deleteNode}>
      <VerticalResizer
        onResizeStop={(_, data) => {
          // save to db
          updateAttrs(data.size);
        }}
        width={state.width}
        height={state.height}
        onResize={(_, data) => {
          setState(data.size);
        }}
        maxConstraints={[MAX_EMBED_WIDTH, MAX_EMBED_HEIGHT]}
        minConstraints={[MIN_EMBED_WIDTH, MIN_EMBED_HEIGHT]}
      >
        <IframeContainer>
          <iframe
            allowFullScreen
            title='iframe'
            src={embeddableSrc}
            style={{
              width: '100%',
              height: '100%',
              border: '0 solid transparent'
            }}
          />
        </IframeContainer>
      </VerticalResizer>
    </BlockAligner>
  );
}

export default memo(IframeComponent);
