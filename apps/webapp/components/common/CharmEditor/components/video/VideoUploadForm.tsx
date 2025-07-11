// upload form src by mux: https://github.com/vercel/next.js/blob/canary/examples/with-mux-video/components/upload-form.js

import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import * as UpChunk from '@mux/upchunk';
import { log } from '@packages/core/log';
import { getVideoSizeLimit, VIDEO_SIZE_LIMITS_LABELS } from '@packages/subscriptions/featureRestrictions';
import { useEffect, useState } from 'react';
import useSwr from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type Props = {
  onComplete: (upload: { assetId: string; playbackId: string }) => void;
  pageId: string | null;
};

export function VideoUploadForm(props: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { space } = useCurrentSpace();
  const sizeLimit = getVideoSizeLimit(space?.subscriptionTier);

  // poll endpoint until video is ready
  const { data: upload, error } = useSwr(
    () => (isPreparing && space ? `/api/mux/upload/${uploadId}` : null),
    () => {
      return charmClient.mux.getUpload({
        id: uploadId!,
        pageId: props.pageId,
        spaceId: space!.id
      });
    },
    {
      refreshInterval: 5000
    }
  );

  useEffect(() => {
    if (upload && upload.playbackId) {
      props.onComplete({ assetId: upload.assetId, playbackId: upload.playbackId });
    }
  }, [upload]);

  if (error) return <Alert severity='error'>Error fetching api</Alert>;

  async function createUpload(fileSize: number) {
    try {
      const result = await charmClient.mux.createUpload(fileSize, space!.id);
      setUploadId(result.id);
      return result.url;
    } catch (e) {
      log.error('Error in createUpload', e);
      setErrorMessage('Error creating upload');
      return '';
    }
  }

  function startUpload(file: File) {
    if (!space || !space.subscriptionTier) {
      return;
    }

    if (file.size > sizeLimit) {
      setErrorMessage(
        `Video size exceeds the limit of ${VIDEO_SIZE_LIMITS_LABELS[space.subscriptionTier]} for your subscription tier`
      );
      return;
    }

    setIsUploading(true);
    const req = UpChunk.createUpload({
      endpoint: () => createUpload(file.size),
      file,
      maxFileSize: sizeLimit
    });

    req.on('error', (err) => {
      setErrorMessage(err.detail.message);
    });

    req.on('progress', (_progress) => {
      setProgress(Math.floor(_progress.detail));
    });

    req.on('success', () => {
      setIsPreparing(true);
    });
  }

  if (errorMessage) return <Alert severity='error'>{errorMessage}</Alert>;

  return (
    <Stack
      key='upload'
      alignItems='center'
      justifyContent='center'
      gap={1}
      width='100%'
      height='92px' /* height is copied from 'Link' tab */
    >
      {isUploading ? (
        <>
          {isPreparing ? (
            <Typography>Preparing...</Typography>
          ) : (
            <Typography>Uploading...{progress ? `${progress}%` : ''}</Typography>
          )}
          <CircularProgress size={30} color='secondary' />
        </>
      ) : (
        <Button component='label' type='button'>
          Select a video file
          <input
            hidden
            type='file'
            onChange={(e) => {
              if (e.target.files) {
                startUpload(e.target.files?.[0]);
              }
            }}
          />
        </Button>
      )}
    </Stack>
  );
}
