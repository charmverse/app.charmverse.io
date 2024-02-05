import { Alert, Stack, TextField, Typography } from '@mui/material';

import charmClient from 'charmClient';
import { useGetFarcasterFrame } from 'charmClient/hooks/farcaster';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

export function FarcasterFrameNodeView({
  selected,
  attrs,
  node,
  deleteNode,
  updateAttrs,
  readOnly,
  pageId
}: CharmNodeViewProps & {
  pageId?: string;
}) {
  const { space } = useCurrentSpace();
  const {
    data: farcasterFrame,
    isLoading,
    error
  } = useGetFarcasterFrame(
    attrs.src
      ? {
          frameUrl: attrs.src,
          pageId
        }
      : undefined
  );

  if (isLoading) {
    return <LoadingComponent minHeight={80} isLoading />;
  }

  if (!attrs.src) {
    if (readOnly) {
      return <div />;
    }
    return (
      <MediaSelectionPopup
        node={node}
        icon={
          <img
            style={{
              width: 25,
              height: 25
            }}
            src='/images/logos/farcaster_logo_grayscale.png'
          />
        }
        isSelected={selected}
        buttonText='Add Farcaster Frame'
        onDelete={deleteNode}
      >
        <MultiTabs
          tabs={[
            [
              'Link',
              <MediaUrlInput
                onSubmit={(frameUrl) => {
                  updateAttrs({ src: frameUrl });
                  if (frameUrl && pageId && space) {
                    charmClient.track.trackAction('add_farcaster_frame', {
                      frameUrl,
                      pageId,
                      spaceId: space.id
                    });
                  }
                }}
                key='link'
                placeholder='https://fc-polls.vercel.app/polls/...'
              />
            ]
          ]}
        />
      </MediaSelectionPopup>
    );
  }

  if (!farcasterFrame || error) {
    return (
      <BlockAligner
        onEdit={() => {
          if (!readOnly) {
            updateAttrs({ src: null });
          }
        }}
        onDelete={deleteNode}
        readOnly={readOnly}
      >
        <Alert severity='warning'>{error?.message ?? 'Failed to load Farcaster Frame'}</Alert>
      </BlockAligner>
    );
  }

  return (
    <BlockAligner
      onEdit={() => {
        if (!readOnly) {
          updateAttrs({ src: null });
        }
      }}
      onDelete={deleteNode}
      readOnly={readOnly}
    >
      <Stack gap={1} my={1}>
        <img src={farcasterFrame.image} width='100%' style={{ objectFit: 'cover' }} />
        {farcasterFrame.inputText && <TextField type='text' placeholder={farcasterFrame.inputText} />}
        <Stack flexDirection='row' gap={1}>
          {farcasterFrame.buttons?.map(({ label, action }, index: number) => (
            <Button
              disabled
              sx={{
                flexGrow: 1,
                flexBasis: `${100 / (farcasterFrame.buttons?.length || 1)}%`
              }}
              variant='outlined'
              color='secondary'
              key={`${index.toString()}`}
            >
              <Typography
                variant='body2'
                sx={{
                  textWrap: 'wrap'
                }}
              >
                {label}
              </Typography>
              {action === 'post_redirect' ? ` ↗` : ''}
            </Button>
          ))}
        </Stack>
      </Stack>
    </BlockAligner>
  );
}
