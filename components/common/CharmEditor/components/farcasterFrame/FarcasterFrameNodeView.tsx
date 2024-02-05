import { Stack, TextField } from '@mui/material';

import { useGetFarcasterFrame } from 'charmClient/hooks/farcaster';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';

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
  readOnly
}: CharmNodeViewProps) {
  const { data: farcasterFrame, isLoading } = useGetFarcasterFrame(attrs.src);

  if (!isLoading) {
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

  if (!farcasterFrame) {
    return null;
  }

  return (
    <BlockAligner onDelete={deleteNode} readOnly={readOnly}>
      <Stack gap={1} my={1}>
        <img src={farcasterFrame.image} width='100%' style={{ objectFit: 'cover' }} />
        {farcasterFrame.inputText && <TextField type='text' placeholder={farcasterFrame.inputText} />}
        <Stack flexDirection='row' gap={1}>
          {farcasterFrame.buttons?.map(({ label, action }, index: number) => (
            <Button
              disabled
              sx={{
                flexGrow: 1
              }}
              variant='outlined'
              color='secondary'
              key={`${index.toString()}`}
            >
              {label}
              {action === 'post_redirect' ? ` ↗` : ''}
            </Button>
          ))}
        </Stack>
      </Stack>
    </BlockAligner>
  );
}
