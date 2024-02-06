import styled from '@emotion/styled';
import LinkIcon from '@mui/icons-material/Link';
import { Alert, Paper, Stack, TextField, Tooltip, Typography, lighten } from '@mui/material';
import { useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFarcasterFrame } from 'hooks/useFarcasterFrame';
import { useFarcasterProfile } from 'hooks/useFarcasterProfile';
import { useSnackbar } from 'hooks/useSnackbar';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import { FarcasterMiniProfile } from './FarcasterMiniProfile';
import { FarcasterSigner } from './FarcasterSigner';

const StyledButton = styled(Button)(({ theme, disabled }) => ({
  width: '100%',
  border: disabled ? '' : `1px solid #855DCD`,
  backgroundColor: theme.palette.mode === 'dark' ? lighten('#855DCD', 0.1) : 'transparent',
  color: theme.palette.mode === 'dark' ? '#fff' : '#855DCD',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#855DCD' : lighten('#855DCD', 0.9)
  }
}));

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
  const { error, isLoadingFrame, farcasterFrame, logout, submitOption, farcasterUser, isLoadingFrameAction } =
    useFarcasterFrame(attrs.src && pageId ? { frameUrl: attrs.src, pageId } : undefined);
  const [inputText, setInputText] = useState('');
  const isFarcasterUserAvailable = farcasterUser && farcasterUser.fid;
  const [, copyToClipboard] = useCopyToClipboard();
  const { showMessage } = useSnackbar();
  const { farcasterProfile } = useFarcasterProfile();

  if (isLoadingFrame) {
    return (
      <Paper sx={{ p: 1, my: 2 }}>
        <LoadingComponent minHeight={80} isLoading />
      </Paper>
    );
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
      <Paper sx={{ p: 1, my: 2 }}>
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
    <Paper sx={{ p: 1, my: 2 }}>
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
                  <StyledButton
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
                    loading={isLoadingFrameAction}
                  >
                    <Typography
                      variant='body1'
                      sx={{
                        fontWeight: 500,
                        textWrap: 'wrap'
                      }}
                    >
                      {label}
                    </Typography>
                    {action === 'post_redirect' ? ` ↗` : ''}
                  </StyledButton>
                </div>
              </Tooltip>
            ))}
          </Stack>
        </Stack>
        {!readOnly ? (
          farcasterUser?.status === 'approved' && farcasterProfile ? (
            <FarcasterMiniProfile logout={logout} farcasterProfile={farcasterProfile} />
          ) : (
            <FarcasterSigner />
          )
        ) : null}
      </BlockAligner>
    </Paper>
  );
}
