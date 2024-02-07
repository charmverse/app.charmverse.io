import styled from '@emotion/styled';
import CallMadeIcon from '@mui/icons-material/CallMade';
import LinkIcon from '@mui/icons-material/Link';
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
import { useFarcasterProfile } from 'hooks/useFarcasterProfile';
import { useFarcasterUser } from 'hooks/useFarcasterUser';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';

import BlockAligner from '../../BlockAligner';
import { MediaSelectionPopup } from '../../common/MediaSelectionPopup';
import { MediaUrlInput } from '../../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../../nodeView/nodeView';

import { farcasterBrandColor, farcasterBrandColorDark, farcasterBrandColorLight } from './constants';
import { FarcasterMiniProfile } from './FarcasterMiniProfile';
import { FarcasterSigner } from './FarcasterSigner';

const StyledButton = styled(Button)(({ theme, disabled }) => ({
  width: '100%',
  border: theme.palette.mode === 'dark' || disabled ? '' : `1px solid ${farcasterBrandColor}`,
  backgroundColor: theme.palette.mode === 'dark' ? farcasterBrandColor : 'transparent',
  color: theme.palette.mode === 'dark' ? '#fff' : farcasterBrandColor,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? farcasterBrandColorDark : farcasterBrandColorLight
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
  const { error, isLoadingFrame, farcasterFrame, submitOption, isLoadingFrameAction } = useFarcasterFrame(
    attrs.src && pageId ? { frameUrl: attrs.src, pageId } : undefined
  );
  const { farcasterUser, logout } = useFarcasterUser();
  const [inputText, setInputText] = useState('');
  const isFarcasterUserAvailable = farcasterUser && farcasterUser.fid;
  const [, copyToClipboard] = useCopyToClipboard();
  const { showMessage } = useSnackbar();
  const { farcasterProfile } = useFarcasterProfile();
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

  const extraControls = [
    {
      onClick() {
        copyToClipboard(node.attrs.src);
        showMessage('Copied frame url', 'info');
      },
      Icon: LinkIcon,
      tooltip: 'Copy frame url'
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
                  borderColor: `${farcasterBrandColor} !important`
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
              disabled={readOnly}
            />
          )}
          <Stack
            flexDirection={{
              xs: 'column',
              md: 'row'
            }}
            gap={1}
            mb={!readOnly ? 1 : 0}
          >
            {farcasterFrame.buttons?.map(({ label, action }, index: number) => (
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
                    disabled={isLoadingFrameAction || readOnly || !isFarcasterUserAvailable}
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
        {!readOnly ? (
          farcasterUser?.status === 'approved' && farcasterProfile ? (
            <Box mt={1}>
              <FarcasterMiniProfile logout={logout} farcasterProfile={farcasterProfile} />
            </Box>
          ) : (
            <FarcasterSigner />
          )
        ) : null}
      </BlockAligner>
      {showEditPopup && popupContent}
    </Paper>
  );
}
