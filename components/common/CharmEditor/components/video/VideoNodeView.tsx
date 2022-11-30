import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import * as React from 'react';

import { MIN_EMBED_WIDTH } from 'lib/embed/constants';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import Resizable from '../Resizable';

import { extractYoutubeEmbedLink } from './utils';
import { VIDEO_ASPECT_RATIO } from './videoSpec';
import type { VideoNodeAttrs } from './videoSpec';

export function VideoNodeView({ deleteNode, readOnly, node, onResizeStop, updateAttrs }: CharmNodeViewProps) {
  const attrs = node.attrs as VideoNodeAttrs;
  // If there are no source for the node, return the image select component
  if (!attrs.src && !attrs.muxId) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup node={node} icon={<VideoLibraryIcon fontSize='small' />} buttonText='Embed a Video'>
          <MediaUrlInput
            onSubmit={(videoUrl) => {
              updateAttrs({
                src: videoUrl
              });
            }}
            placeholder='https://youtube.com...'
          />
        </MediaSelectionPopup>
      );
    }
  }
  if (attrs.src) {
    const embedUrl = extractYoutubeEmbedLink(attrs.src) || attrs.src;
    return (
      <Resizable
        aspectRatio={VIDEO_ASPECT_RATIO}
        initialSize={attrs.width}
        minWidth={MIN_EMBED_WIDTH}
        updateAttrs={(args) => {
          updateAttrs({ width: args.size });
        }}
        onDelete={deleteNode}
        onResizeStop={onResizeStop}
      >
        <IframeContainer>
          <iframe
            allowFullScreen
            title='iframe'
            src={embedUrl}
            style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
          />
        </IframeContainer>
      </Resizable>
    );
  }
  return <BlockAligner onDelete={deleteNode}>Hello world</BlockAligner>;
}
