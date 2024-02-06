import LinkIcon from '@mui/icons-material/Link';
import { Alert, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFarcasterFrame } from 'hooks/useFarcasterFrame';
import { useSnackbar } from 'hooks/useSnackbar';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import { FarcasterSigner } from './FarcasterSigner';

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
  const { address } = useAccount();
  const { space } = useCurrentSpace();
  const { error, isLoadingFrame, farcasterFrame, submitOption, farcasterUser, isLoadingFrameAction } =
    useFarcasterFrame(attrs.src && pageId ? { frameUrl: attrs.src, pageId } : undefined);
  const [inputText, setInputText] = useState('');
  const isFarcasterUserAvailable = farcasterUser && farcasterUser.fid;
  const [, copyToClipboard] = useCopyToClipboard();
  const { showMessage } = useSnackbar();

  if (isLoadingFrame) {
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
      <Paper sx={{ p: 1 }}>
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
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 1 }}>
      <BlockAligner
        onEdit={() => {
          if (!readOnly) {
            updateAttrs({ src: null });
          }
        }}
        extraControls={[
          {
            onClick() {
              copyToClipboard(node.attrs.src);
              showMessage('Copied frame url', 'info');
            },
            Icon: LinkIcon,
            tooltip: 'Copy frame url'
          }
        ]}
        onDelete={deleteNode}
        readOnly={readOnly}
      >
        <Stack gap={1}>
          <img src={farcasterFrame.image} width='100%' style={{ objectFit: 'cover' }} />
          {farcasterFrame.inputText && (
            <TextField
              type='text'
              placeholder={farcasterFrame.inputText}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={readOnly}
            />
          )}
          <Stack flexDirection='row' gap={1} mb={1}>
            {farcasterFrame.buttons?.map(({ label, action }, index: number) => (
              <Tooltip
                title={
                  !address
                    ? 'Please connect your wallet'
                    : !isFarcasterUserAvailable
                    ? 'Please sign in with Farcaster'
                    : undefined
                }
                key={`${index.toString()}`}
              >
                <div
                  style={{
                    flexGrow: 1,
                    flexBasis: `${100 / (farcasterFrame.buttons?.length || 1)}%`
                  }}
                >
                  <Button
                    disabled={readOnly || !isFarcasterUserAvailable}
                    onClick={() => {
                      submitOption({
                        buttonIndex: index + 1,
                        inputText
                      }).then(() => {
                        updateAttrs({
                          src: farcasterFrame.postUrl
                        });
                      });
                    }}
                    sx={{
                      width: '100%'
                    }}
                    variant='outlined'
                    color='secondary'
                    loading={isLoadingFrameAction}
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
                </div>
              </Tooltip>
            ))}
          </Stack>
        </Stack>
        {!readOnly ? <FarcasterSigner /> : null}
      </BlockAligner>
    </Paper>
  );
}
