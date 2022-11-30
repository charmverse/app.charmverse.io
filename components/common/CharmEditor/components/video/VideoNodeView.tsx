import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import MuxVideo from '@mux/mux-video-react';

import MultiTabs from 'components/common/MultiTabs';
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

  // for testing
  // attrs.muxId = 'DS00Spx1CV902MCtPj5WknGlR102V5HFkDe';

  // If there are no source for the node, return the image select component
  if (!attrs.src && !attrs.muxId) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup
          onDelete={deleteNode}
          node={node}
          icon={<VideoLibraryIcon fontSize='small' />}
          buttonText='Embed a Video'
        >
          <MultiTabs
            tabs={[
              [
                'Link',
                <MediaUrlInput
                  key='link'
                  onSubmit={(videoUrl) => {
                    updateAttrs({
                      src: videoUrl
                    });
                  }}
                  placeholder='https://youtube.com...'
                />
              ],
              [
                'Upload',
                <MediaUrlInput
                  key='upload'
                  onSubmit={(videoUrl) => {
                    updateAttrs({
                      src: videoUrl
                    });
                  }}
                  placeholder='https://youtube.com...'
                />
              ]
            ]}
          />
        </MediaSelectionPopup>
      );
    }
  }
  if (attrs.muxId) {
    return (
      <BlockAligner onDelete={deleteNode}>
        <MuxVideo
          style={{ height: '100%', maxWidth: '100%' }}
          playbackId={attrs.muxId}
          // for analytics
          // metadata={{
          //   video_id: 'video-id-123456'
          //   video_title: 'Super Interesting Video',
          //   viewer_user_id: 'user-id-bc-789'
          // }}
          streamType='on-demand'
          controls
        />
      </BlockAligner>
    );
  } else if (attrs.src) {
    const embedUrl = (attrs.src && extractYoutubeEmbedLink(attrs.src)) || attrs.src;
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
  return null;
}
