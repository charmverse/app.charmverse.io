import styled from '@emotion/styled';
import CallMadeIcon from '@mui/icons-material/CallMade';
import LinkIcon from '@mui/icons-material/Link';
import ReplayIcon from '@mui/icons-material/Replay';
import { Alert, Box, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import PopperPopup from 'components/common/PopperPopup';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFarcasterFrame } from 'hooks/useFarcasterFrame';
import { useFarcasterUser } from 'hooks/useFarcasterUser';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';

import BlockAligner from '../../BlockAligner';
import { MediaSelectionPopup } from '../../common/MediaSelectionPopup';
import { MediaUrlInput } from '../../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../../nodeView/nodeView';

import { FarcasterMiniProfile } from './FarcasterMiniProfile';
import { FarcasterSigner } from './FarcasterSigner';

const StyledButton = styled(Button)(({ theme, disabled }) => ({
  width: '100%',
  border: theme.palette.mode === 'dark' ? '' : `1px solid ${disabled ? 'transparent' : theme.palette.farcaster.main}`,
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.farcaster.main : 'transparent',
  color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.farcaster.main,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.farcaster.dark : theme.palette.farcaster.light
  },
  height: '100%'
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
  const { space } = useCurrentSpace();
  const { error, isLoadingFrame, getFarcasterFrame, farcasterFrame, submitOption, isLoadingFrameAction } =
    useFarcasterFrame(attrs.src ? { frameUrl: attrs.src, pageId } : undefined);
  const { farcasterUser, logout, farcasterProfile } = useFarcasterUser();
  const [inputText, setInputText] = useState('');
  const isFarcasterUserAvailable = farcasterUser && farcasterUser.fid;
  const [, copyToClipboard] = useCopyToClipboard();
  const { showMessage } = useSnackbar();
  const [showEditPopup, setShowEditPopup] = useState(false);
  const isSmallScreen = useSmallScreen();
  function openPopup() {
    setShowEditPopup(true);
  }

  function closePopup() {
    setShowEditPopup(false);
  }

  const popupContent = useMemo(
    () => (
      <PopperPopup
        popupContent={
          <Paper sx={{ p: 2 }}>
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
                closePopup();
              }}
              initialValue={attrs.src}
              placeholder='https://fc-polls.vercel.app/polls/...'
            />
          </Paper>
        }
        open={showEditPopup}
        onClose={closePopup}
      />
    ),
    [pageId, space, showEditPopup]
  );

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
        buttonText='Add a Frame (Farcaster)'
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

  const extraControls = [
    ...(!farcasterFrame || error
      ? [
          {
            onClick() {
              getFarcasterFrame();
            },
            Icon: ReplayIcon,
            tooltip: 'Refetch frame',
            showOnReadonly: true
          }
        ]
      : []),
    {
      onClick() {
        copyToClipboard(node.attrs.src);
        showMessage('Copied frame url', 'info');
      },
      Icon: LinkIcon,
      tooltip: 'Copy frame url',
      showOnReadonly: true
    }
  ];

  if (!farcasterFrame || error) {
    return (
      <Paper sx={{ p: 1, my: 2 }}>
        <BlockAligner
          extraControls={extraControls}
          onEdit={() => {
            if (!readOnly) {
              openPopup();
            }
          }}
          onDelete={deleteNode}
          readOnly={readOnly}
        >
          <Alert severity='warning'>{error?.message ?? 'Failed to load Farcaster Frame'}</Alert>
        </BlockAligner>
        {showEditPopup && popupContent}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 1, my: 2 }}>
      <BlockAligner
        onEdit={() => {
          if (!readOnly) {
            openPopup();
          }
        }}
        extraControls={extraControls}
        onDelete={deleteNode}
        readOnly={readOnly}
      >
        <Stack gap={1}>
          <img
            src={farcasterFrame.image}
            style={{ width: '100%', height: isSmallScreen ? 'fit-content' : 450, objectFit: 'cover' }}
          />
          {farcasterFrame.inputText && (
            <TextField
              type='text'
              placeholder={farcasterFrame.inputText}
              value={inputText}
              // Prevent losing focus when clicking on the input
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              sx={{
                '& fieldset': {
                  borderColor: (theme) => `${theme.palette.farcaster.main} !important`
                }
              }}
              // Prevent the typed text to replace the component
              onKeyDown={(e) => {
                e.preventDefault();
              }}
              // e.target.value is always empty, so we use the event key
              onKeyDownCapture={(e) => {
                if (e.key.length === 1) {
                  setInputText((prevInputText) => prevInputText + e.key);
                }
              }}
            />
          )}
          <Stack
            flexDirection={{
              xs: 'column',
              md: 'row'
            }}
            gap={1}
            mb={1}
          >
            {farcasterFrame.buttons
              ?.filter(({ label }) => label)
              .map(({ label, action }, index: number) => (
                <Tooltip
                  title={!isFarcasterUserAvailable ? 'Please sign in with Farcaster' : undefined}
                  key={`${index.toString()}`}
                >
                  <div
                    style={{
                      flexGrow: 1,
                      flexBasis: `${100 / (farcasterFrame.buttons?.length || 1)}%`
                    }}
                  >
                    <StyledButton
                      disabled={isLoadingFrameAction || !isFarcasterUserAvailable}
                      onClick={() => {
                        submitOption({
                          buttonIndex: index + 1,
                          inputText
                        });
                      }}
                      loading={isLoadingFrameAction}
                    >
                      <Typography
                        variant='body2'
                        sx={{
                          fontWeight: 500,
                          textWrap: 'wrap'
                        }}
                      >
                        {label}
                      </Typography>
                      {action === 'post_redirect' ? <CallMadeIcon sx={{ ml: 0.5, fontSize: 14 }} /> : null}
                    </StyledButton>
                  </div>
                </Tooltip>
              ))}
          </Stack>
        </Stack>
        {farcasterUser?.status === 'approved' && farcasterProfile ? (
          <Box mt={1}>
            <FarcasterMiniProfile logout={logout} farcasterProfile={farcasterProfile} />
          </Box>
        ) : (
          <FarcasterSigner />
        )}
      </BlockAligner>
      {showEditPopup && popupContent}
    </Paper>
  );
}
