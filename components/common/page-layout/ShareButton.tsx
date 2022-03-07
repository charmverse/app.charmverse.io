import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Switch from '@mui/material/Switch';
import Input from '@mui/material/Input';
import { usePopupState, bindPopover, bindTrigger } from 'material-ui-popup-state/hooks';
import styled from '@emotion/styled';
import { usePages } from 'hooks/usePages';
import { Page, Block } from '@prisma/client';
import charmClient from 'charmClient';
import { useRouter } from 'next/router';

const StyledInput = styled(Input)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  font-size: .8em;
  padding-left: 1em;
`;

const LinkBox = styled(Box)`
  background: ${({ theme }) => theme.palette.background.dark};
`;

function SelectBlockView ({
  views,
  currentView,
  onSelected }: {
    views: Block [],
    currentView?: string | null,
    onSelected: (viewId: string) => any}) {
  return (
    <FormControl fullWidth>
      <InputLabel variant='standard' htmlFor='uncontrolled-native'>
        Select view to share
      </InputLabel>
      <NativeSelect
        defaultValue={currentView}
        inputProps={{
          id: 'select-view'
        }}
        onChange={e => onSelected(e.target.value)}
      >
        {
          views.map(view => {
            return <option key={view.id} value={view.id}>{view.title}</option>;
          })
        }
      </NativeSelect>
    </FormControl>
  );
}

export default function ShareButton ({ headerHeight }: { headerHeight: number }) {

  const { currentPage, setPages } = usePages();
  const router = useRouter();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const [copied, setCopied] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState(false);
  const [views, setViews] = useState<Block []>([]);

  const [viewIdToShare, setViewIdToShare] = useState<null | string>((router.query.viewId as string) ?? null);
  const [shareLink, setShareLink] = useState<null | string>(null);

  const [loadingViews, setLoadingViews] = useState(false);

  useEffect(() => {
    if (currentPage) {
      setIsPublic(currentPage.isPublic);
      if (currentPage.type === 'board') {
        loadViews();
      }

    }
  }, [currentPage]);

  useEffect(() => {
    updateShareLink();
  }, [isPublic, viewIdToShare, views]);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function loadViews () {
    setLoadingViews(false);
    const foundViews = await charmClient.getBlockViewsByPageId(currentPage!.id);
    setViews(foundViews);
    setLoadingViews(false);
  }

  async function togglePublic () {
    const updatedPage = await charmClient.togglePagePublicAccess(currentPage!.id, !isPublic);
    setIsPublic(updatedPage.isPublic);
    const updates = { isPublic: updatedPage.isPublic };
    setPages(pages => pages.map(p => p.id === currentPage!.id ? { ...p, ...updates } : p));
  }

  async function updateShareLink () {
    if (isPublic === false) {
      setShareLink(null);
    }
    else if (currentPage?.type === 'page') {
      const shareLinkToSet = (currentPage && typeof window !== 'undefined')
        ? `${window.location.origin}/share/${currentPage.id}` : '';
      setShareLink(shareLinkToSet);
    }
    else if (currentPage?.type === 'board') {
      const viewIdToProvide = viewIdToShare ?? router.query.viewId;
      const shareLinkToSet = (currentPage && typeof window !== 'undefined')
        ? `${window.location.origin}/share/view/${viewIdToProvide}` : '';
      setShareLink(shareLinkToSet);
    }
  }

  function viewSelected (selectedViewId: string) {
    if (selectedViewId) {
      setViewIdToShare(selectedViewId);
    }

  }

  // We'll need to modify this

  return (
    <>
      <Button
        color='secondary'
        variant='text'
        size='small'
        {...bindTrigger(popupState)}
      >
        Share
      </Button>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        anchorReference='none'
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        PaperProps={{
          sx: {
            width: 400,
            top: headerHeight,
            right: 0
          }
        }}
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          onChange={togglePublic}
          padding={1}
        >
          <Box>
            <Typography>Share to web</Typography>
            <Typography variant='body2' color='secondary'>
              {isPublic
                ? 'Anyone with the link can view'
                : 'Publish and share link with anyone'}
            </Typography>
          </Box>
          <Switch
            checked={isPublic}
          />
        </Box>
        <Collapse in={isPublic}>
          {
            loadingViews === true && (
              <Box component='p'>
                <CircularProgress size={20} />
                <Box component='span' alignItems='center' sx={{ pl: 2 }}>
                  Loading views
                </Box>
              </Box>

            )
          }
          {
            currentPage!.type === 'board' && loadingViews === false && (
              <Box alignItems='center' sx={{ pl: 2 }}>
                <SelectBlockView views={views} currentView={viewIdToShare} onSelected={viewSelected} />
              </Box>

            )
          }
          {
            shareLink && (
            <LinkBox p={1}>
              <StyledInput
                fullWidth
                disableUnderline
                value={shareLink}
                endAdornment={(
                  <CopyToClipboard text={shareLink} onCopy={onCopy}>
                    <Button color='secondary' variant='text' size='small'>
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </CopyToClipboard>
              )}
              />
            </LinkBox>
            )
          }
        </Collapse>
      </Popover>
    </>
  );
}
