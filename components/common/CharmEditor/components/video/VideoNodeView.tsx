import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import * as React from 'react';

import { VIDEO_ASPECT_RATIO, MIN_EMBED_WIDTH } from 'lib/embed/constants';

import BlockAligner from '../BlockAligner';
import { EmbeddedInputPopup } from '../common/EmbeddedInputPopup';
import { EmbeddedUrl } from '../common/EmbeddedUrl';
import { IframeContainer } from '../common/IframeContainer';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import Resizable from '../Resizable';

import type { VideoNodeAttrs } from './videoSpec';

export function VideoNodeView({ deleteNode, readOnly, node, onResizeStop, updateAttrs }: CharmNodeViewProps) {
  const attrs = node.attrs as Partial<VideoNodeAttrs>;

  // If there are no source for the node, return the image select component
  if (!attrs.url && !attrs.muxId) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <EmbeddedInputPopup node={node} embedIcon={<VideoLibraryIcon fontSize='small' />} embedText='Embed a Video'>
          <EmbeddedUrl
            onSubmit={(videoUrl) => {
              updateAttrs({
                url: videoUrl
              });
            }}
            placeholder='https://youtube.com...'
          />
        </EmbeddedInputPopup>
      );
    }
  }
  if (attrs.url) {
    return (
      <Resizable
        aspectRatio={VIDEO_ASPECT_RATIO}
        initialSize={node.attrs.width}
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
            src={node.attrs.src}
            style={{ height: '100%', border: '0 solid transparent', width: '100%' }}
          />
        </IframeContainer>
      </Resizable>
    );
  }
  return <BlockAligner onDelete={deleteNode}>Hello world</BlockAligner>;
}
