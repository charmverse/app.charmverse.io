import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MoonIcon from '@mui/icons-material/DarkMode';
import SunIcon from '@mui/icons-material/WbSunny';
import GetAppIcon from '@mui/icons-material/GetApp';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Popover from '@mui/material/Popover';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import { charmEditorPlugins, specRegistry } from 'components/common/CharmEditor/CharmEditor';
import { useColorMode } from 'context/darkMode';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import React, { useRef, useState } from 'react';
import CommentIcon from '@mui/icons-material/Comment';
import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { PageContent } from 'models';
import { Node } from '@bangle.dev/pm';
import ListItemText from '@mui/material/ListItemText';
import { useCommentThreadsListDisplay } from 'hooks/useCommentThreadsListDisplay';
import Account from '../Account';
import ShareButton from '../ShareButton';
import PageTitleWithBreadcrumbs from './PageTitleWithBreadcrumbs';

export const headerHeight = 56;

const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

function CommentThreadsListButton () {
  const { showingCommentThreadsList, setShowingCommentThreadsList } = useCommentThreadsListDisplay();
  return (
    <Tooltip title={`${showingCommentThreadsList ? 'Hide' : 'Show'} comment threads`} arrow placement='bottom'>
      <IconButton
        color={!showingCommentThreadsList ? 'secondary' : 'inherit'}
        onClick={() => {
          setShowingCommentThreadsList(!showingCommentThreadsList);
        }}
        sx={showingCommentThreadsList ? { backgroundColor: 'emoji.hoverBackground' } : {}}
      >
        <CommentIcon
          fontSize='small'
        />
      </IconButton>
    </Tooltip>
  );
}

export default function Header (
  { open, openSidebar }:
  {
    open: boolean, openSidebar: () => void }
) {
  const router = useRouter();
  const colorMode = useColorMode();
  const { pages, currentPageId } = usePages();
  const [user, setUser] = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();
  const currentPage = currentPageId ? pages[currentPageId] : undefined;

  const isFavorite = currentPage && user?.favorites.some(({ pageId }) => pageId === currentPage.id);

  const isPage = router.route.includes('pageId');
  const pageType = (currentPage as Page)?.type;
  const isExportablePage = pageType === 'card' || pageType === 'page';

  async function toggleFavorite () {
    if (!currentPage || !user) return;
    const pageId = currentPage.id;
    const updatedFields = isFavorite
      ? await charmClient.unfavoritePage(pageId)
      : await charmClient.favoritePage(pageId);
    setUser({ ...user, ...updatedFields });
  }

  function generateMarkdown () {
    if (currentPage && isExportablePage) {
      const serializer = markdownSerializer(specRegistry);

      const state = new BangleEditorState({
        specRegistry,
        plugins: charmEditorPlugins(),
        initialValue: currentPage.content ? Node.fromJSON(specRegistry.schema, currentPage.content as PageContent) : ''
      });

      let markdown = serializer.serialize(state.pmState.doc);

      if (currentPage.title) {
        const pageTitleAsMarkdown = `# ${currentPage.title}`;

        markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
      }

      const data = new Blob([markdown], { type: 'text/plain' });

      const linkElement = document.createElement('a');

      linkElement.download = `${currentPage.title || 'page'}.md`;

      const downloadLink = URL.createObjectURL(data);

      linkElement.href = downloadLink;

      linkElement.click();

      URL.revokeObjectURL(downloadLink);
    }

  }

  return (
    <StyledToolbar variant='dense'>
      <IconButton
        color='inherit'
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
        <PageTitleWithBreadcrumbs />
        <Box display='flex' alignItems='center'>
          {isPage && (
            <>
              {currentPage?.deletedAt === null && <ShareButton headerHeight={headerHeight} />}
              {currentPage?.type !== 'board' && <CommentThreadsListButton />}
              <Tooltip title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} arrow placement='bottom'>
                <IconButton size='small' sx={{ ml: 1 }} onClick={toggleFavorite} color='inherit'>
                  {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
                </IconButton>
              </Tooltip>
            </>
          )}

          {isPage && isExportablePage && (
            <Box sx={{ ml: 1 }} ref={pageMenuAnchor}>
              <IconButton
                size='small'
                onClick={() => {
                  setPageMenuOpen(!pageMenuOpen);
                  setPageMenuAnchorElement(pageMenuAnchor.current || null);
                }}
              >
                <MoreHorizIcon />
              </IconButton>
              <Popover
                anchorEl={pageMenuAnchorElement}
                open={pageMenuOpen}
                onClose={() => setPageMenuOpen(false)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                <List dense>
                  <ListItemButton onClick={() => {
                    setPageMenuOpen(false);
                    generateMarkdown();
                  }}
                  >
                    <GetAppIcon
                      fontSize='small'
                      sx={{
                        mr: 1
                      }}
                    />
                    <ListItemText primary='Export to markdown' />
                  </ListItemButton>
                </List>
              </Popover>
            </Box>
          )}

          {/** dark mode toggle */}
          <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
            <IconButton sx={{ mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
              {theme.palette.mode === 'dark' ? <SunIcon color='secondary' /> : <MoonIcon color='secondary' />}
            </IconButton>
          </Tooltip>
          {/** user account */}
          <Account />
        </Box>
      </Box>
    </StyledToolbar>
  );
}
