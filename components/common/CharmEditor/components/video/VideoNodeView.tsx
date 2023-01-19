import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import MuxVideo from '@mux/mux-video-react';
import { useEffect, useState } from 'react';
import useSwr from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import BlockAligner from '../BlockAligner';
import { IframeContainer } from '../common/IframeContainer';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import { MIN_EMBED_WIDTH } from '../iframe/config';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import Resizable from '../Resizable';

import { extractYoutubeEmbedLink } from './utils';
import { VIDEO_ASPECT_RATIO } from './videoSpec';
import type { VideoNodeAttrs } from './videoSpec';
import { VideoUploadForm } from './VideoUploadForm';

export function VideoNodeView({
  deleteNode,
  pageId,
  readOnly,
  node,
  onResizeStop,
  selected,
  updateAttrs,
  isPost = false
}: CharmNodeViewProps & { isPost?: boolean }) {
  const attrs = node.attrs as VideoNodeAttrs;
  const space = useCurrentSpace();
  const [playbackIdWithToken, setPlaybackIdWithToken] = useState('');

  // poll endpoint until video is ready
  const { data: asset } = useSwr(
    () => (attrs.muxAssetId && !playbackIdWithToken && pageId && space ? `/api/mux/asset/${attrs.muxAssetId}` : null),
    () => {
      return charmClient.mux.getAsset({ id: attrs.muxAssetId!, pageId: pageId!, spaceId: space!.id });
    },
    {
      refreshInterval: 5000
    }
  );

  useEffect(() => {
    if (asset && asset.status === 'ready') {
      setPlaybackIdWithToken(asset.playbackId);
    }
  }, [asset]);

  async function onUploadComplete(uploadAttrs: { assetId: string; playbackId: string }) {
    updateAttrs({
      muxPlaybackId: uploadAttrs.playbackId,
      muxAssetId: uploadAttrs.assetId
    });
  }

  // If there are no source for the node, return the image select component
  if (!attrs.src && !attrs.muxAssetId) {
    if (readOnly || (!pageId && !isPost)) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup
          onDelete={deleteNode}
          node={node}
          icon={<VideoLibraryIcon fontSize='small' />}
          isSelected={selected}
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
              ['Upload', <VideoUploadForm key='upload' onComplete={onUploadComplete} pageId={pageId ?? null} />]
            ]}
          />
        </MediaSelectionPopup>
      );
    }
  }

  if (attrs.muxAssetId) {
    if (playbackIdWithToken) {
      return (
        <BlockAligner onDelete={deleteNode}>
          <MuxVideo
            style={{ height: '100%', maxWidth: '100%', width: '100%' }}
            playbackId={playbackIdWithToken} // asset.playbackId includes signed token
            // for analytics
            metadata={{
              page_id: pageId
              // video_id: 'video-id-123456'
              // video_title: 'Super Interesting Video',
              // viewer_user_id: 'user-id-bc-789'
            }}
            streamType='on-demand'
            controls
          />
        </BlockAligner>
      );
    } else {
      return <LoadingComponent minHeight={200} isLoading={true} label='Video is processing...' />;
    }
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
