import { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import { Box, CircularProgress } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import LinkIcon from '@mui/icons-material/Link';
import { useColorMode } from 'context/color-mode';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';

export const headerHeight = 56;

const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

export default function Header ({ open, openSidebar }: { open: boolean, openSidebar: () => void }) {
  const router = useRouter();
  const colorMode = useColorMode();
  const [pageTitle] = usePageTitle();
  const { currentPage, isEditing } = usePages();
  const [user, setUser] = useUser();
  const [isPublic, setIsPublic] = useState(currentPage?.isPublic === true);
  const theme = useTheme();

  useEffect(() => {
    if (currentPage) {
      setIsPublic(currentPage.isPublic);
    }
  }, [currentPage]);

  const isFavorite = currentPage && user?.favorites.some(({ pageId }) => pageId === currentPage.id);

  const isPage = router.route.includes('pageId');

  async function toggleFavorite () {
    if (!currentPage || !user) return;
    const pageId = currentPage.id;
    const newUser = isFavorite
      ? await charmClient.unfavoritePage(pageId)
      : await charmClient.favoritePage(pageId);
    setUser(newUser);
  }

  async function togglePublic (newPublicStatus: boolean) {
    const updatedPage = await charmClient.togglePagePublicAccess(currentPage!.id, newPublicStatus);
    setIsPublic(updatedPage.isPublic);
  }

  function generateShareLink () {

    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/share/${currentPage?.id}`;
    navigator.clipboard.writeText(shareLink);
    return shareLink;
  }

  return (
    <StyledToolbar variant='dense'>
      <IconButton
        color='inherit'
        aria-label='open drawer'
        onClick={openSidebar}
        edge='start'
        sx={{
          marginRight: '36px',
          ...(open && { display: 'none' })
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        width: '100%'
      }}
      >
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
        >
          <Typography noWrap component='div' sx={{ fontWeight: 500, maxWidth: 500, textOverflow: 'ellipsis' }}>
            {pageTitle}
          </Typography>
          {isEditing && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
            >
              <CircularProgress size={12} />
              <Typography variant='subtitle2'>
                Saving
              </Typography>
            </Box>
          )}
        </Box>
        {/** favorite toggle */}
        <Box>
          {isPage && (
          <>
            <Tooltip title={isPublic ? 'Make private' : 'Make public'} arrow placement='bottom'>
              <FormControlLabel
                control={(
                  <Switch
                    checked={isPublic}
                    onChange={ev => {
                      togglePublic(ev.target.checked);
                    }}
                    inputProps={{ 'aria-label': 'toggle public access' }}
                  />
                )}
                label={isPublic === true ? 'Public' : 'Private'}
              />

            </Tooltip>
            {
              isPublic === true && (
                <Tooltip title='Copy sharing link' arrow placement='bottom'>

                  <IconButton
                    sx={{ ml: 1 }}
                    color='inherit'
                    onClick={generateShareLink}
                  >
                    {isPublic ? <LinkIcon color='secondary' /> : <LinkIcon color='secondary' />}
                  </IconButton>

                </Tooltip>
              )
            }

            <Tooltip title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} arrow placement='bottom'>
              <IconButton sx={{ ml: 1 }} onClick={toggleFavorite} color='inherit'>
                {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
              </IconButton>
            </Tooltip>
          </>
          )}
          {/** dark mode toggle */}
          <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
              {theme.palette.mode === 'dark' ? <Brightness7Icon color='secondary' /> : <Brightness4Icon color='secondary' />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </StyledToolbar>
  );
}
