import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
import { Page } from '@prisma/client';
import charmClient from 'charmClient';

const StyledInput = styled(Input)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  font-size: .8em;
  padding-left: 1em;
`;

const LinkBox = styled(Box)`
  background: ${({ theme }) => theme.palette.background.dark};
`;

export default function ShareButton ({ headerHeight }: { headerHeight: number }) {

  const { currentPage, setPages } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const [copied, setCopied] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (currentPage) {
      setIsPublic(currentPage.isPublic);
    }
  }, [currentPage]);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function togglePublic () {
    const updatedPage = await charmClient.togglePagePublicAccess(currentPage!.id, !isPublic);
    setIsPublic(updatedPage.isPublic);
    const updates = { isPublic: updatedPage.isPublic };
    setPages(pages => pages.map(p => p.id === currentPage!.id ? { ...p, ...updates } : p));
  }

  const shareLink = (currentPage && typeof window !== 'undefined')
    ? `${window.location.origin}/share/${currentPage.id}` : '';

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
        </Collapse>
      </Popover>
    </>
  );
}
