import { useState, useContext, useRef } from 'react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuIcon from '@mui/icons-material/Menu';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import { Box, CircularProgress } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Avatar from 'components/common/Avatar';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import { useColorMode } from 'context/color-mode';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import { useCurrentEditorView } from 'hooks/useCurrentEditorView';
import { useRouter } from 'next/router';
import getDisplayName from 'lib/users/getDisplayName';
import { EditorViewContext } from '@bangle.dev/react';
import { markdownParser, markdownSerializer } from '@bangle.dev/markdown';
import { BangleEditor, BangleEditorState } from '@bangle.dev/core';
import { specRegistry } from 'components/editor/CharmEditor';

import { EditorView } from '@bangle.dev/pm';
import Account from './Account';
import ShareButton from './ShareButton';

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
  const { pages, currentPageId, isEditing } = usePages();
  const [user, setUser] = useUser();
  const theme = useTheme();
  const [currentEditorView] = useCurrentEditorView();

  const renders = useRef(0);

  renders.current += 1;

  console.log('Header renders', renders.current);

  const currentPage = currentPageId && pages[currentPageId];

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

  function generateMarkdown () {

    if (currentEditorView) {
      const parser = markdownParser(specRegistry);

      const serializer = markdownSerializer(specRegistry);
      console.log(serializer);
      const md = serializer.serialize(currentEditorView.state.doc);

      console.log('Markdown\r\n', md);
    }

  }

  console.log('View', currentEditorView);

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
        <Box display='flex' alignItems='center'>
          {isPage && (
            <>
              <ShareButton headerHeight={headerHeight} />

              <Tooltip title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} arrow placement='bottom'>
                <IconButton size='small' sx={{ ml: 1 }} onClick={toggleFavorite} color='inherit'>
                  {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
                </IconButton>
              </Tooltip>

              <Typography onClick={generateMarkdown}>Export to MD</Typography>
            </>
          )}

          {/** context menu */}
          {/* <IconButton size='small' sx={{ mx: 1 }} color='inherit'>
            <MoreHorizIcon />
          </IconButton> */}
          {/** dark mode toggle */}
          <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
            <IconButton sx={{ mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
              {theme.palette.mode === 'dark' ? <Brightness7Icon color='secondary' /> : <Brightness4Icon color='secondary' />}
            </IconButton>
          </Tooltip>
          {/** user account */}
          <Account />
        </Box>
      </Box>
    </StyledToolbar>
  );
}
