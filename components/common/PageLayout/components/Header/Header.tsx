import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MoonIcon from '@mui/icons-material/DarkMode';
import GetAppIcon from '@mui/icons-material/GetApp';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import SunIcon from '@mui/icons-material/WbSunny';
import { Divider, FormControlLabel, Switch } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import PublishToSnapshot from 'components/common/PageLayout/components/Header/components/Snapshot/PublishToSnapshot';
import { useColorMode } from 'context/darkMode';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import Account from '../Account';
import ShareButton from '../ShareButton';
import PageTitleWithBreadcrumbs from './components/PageTitleWithBreadcrumbs';
import NotificationsBadge from './components/NotificationsBadge';

export const headerHeight = 56;

export const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

interface HeaderProps {
  open: boolean;
  openSidebar: () => void;
  hideSidebarOnSmallScreen?: boolean;
}

export default function Header ({ open, openSidebar, hideSidebarOnSmallScreen }: HeaderProps) {
  const router = useRouter();
  const colorMode = useColorMode();
  const { pages, currentPageId, setPages } = usePages();
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
  const { setCurrentPageActionDisplay } = usePageActionDisplay();

  async function toggleFavorite () {
    if (!currentPage || !user) return;
    const pageId = currentPage.id;
    const updatedFields = isFavorite
      ? await charmClient.unfavoritePage(pageId)
      : await charmClient.favoritePage(pageId);
    setUser({ ...user, ...updatedFields });
  }

  async function exportMarkdown () {
    const markdownContent = await generateMarkdown(currentPage as Page);

    if (markdownContent) {
      const data = new Blob([markdownContent], { type: 'text/plain' });

      const linkElement = document.createElement('a');

      linkElement.download = `${currentPage?.title || 'page'}.md`;

      const downloadLink = URL.createObjectURL(data);

      linkElement.href = downloadLink;

      linkElement.click();

      URL.revokeObjectURL(downloadLink);
    }
  }

  const isFullWidth = currentPage?.fullWidth ?? false;

  return (
    <StyledToolbar variant='dense'>
      <IconButton
        color='inherit'
        onClick={openSidebar}
        edge='start'
        sx={{
          display: {
            xs: hideSidebarOnSmallScreen ? 'none' : 'inline-flex',
            md: 'inline-flex'
          },
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
              <IconButton size='small' onClick={toggleFavorite} color='inherit'>
                <Tooltip title={isFavorite ? 'Remove from sidebar' : 'Pin this page to your sidebar'} arrow placement='bottom'>
                  {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
                </Tooltip>
              </IconButton>
            </>
          )}

          {currentPage && isPage && isExportablePage && (
            <Box sx={{ ml: 1 }} ref={pageMenuAnchor}>
              <IconButton
                size='small'
                onClick={() => {
                  setPageMenuOpen(!pageMenuOpen);
                  setPageMenuAnchorElement(pageMenuAnchor.current || null);
                }}
              >
                <Tooltip title='View comments, votes, export content and more' arrow>
                  <MoreHorizIcon />
                </Tooltip>
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
                  {isPage && (
                  <>
                    <ListItemButton onClick={() => {
                      setCurrentPageActionDisplay('comments');
                      setPageMenuOpen(false);
                    }}
                    >
                      <CommentOutlinedIcon
                        fontSize='small'
                        sx={{
                          mr: 1
                        }}
                      />
                      <ListItemText primary='View comments' />
                    </ListItemButton>
                    <ListItemButton onClick={() => {
                      setCurrentPageActionDisplay('votes');
                      setPageMenuOpen(false);
                    }}
                    >
                      <HowToVoteOutlinedIcon
                        fontSize='small'
                        sx={{
                          mr: 1
                        }}
                      />
                      <ListItemText primary='View votes' />
                    </ListItemButton>
                  </>
                  )}
                  <Divider />
                  <ListItemButton onClick={() => {
                    exportMarkdown();
                    setPageMenuOpen(false);
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

                  {/* Publishing to snapshot */}

                  <PublishToSnapshot page={currentPage as Page} />
                  <Divider />
                  <ListItemButton>
                    <FormControlLabel
                      sx={{
                        marginLeft: 0.5,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      labelPlacement='start'
                      control={(
                        <Switch
                          size='small'
                          checked={isFullWidth}
                          onChange={async () => {
                            await charmClient.updatePage({
                              id: currentPage.id,
                              fullWidth: !isFullWidth
                            });
                            setPages((_pages) => ({ ..._pages, [currentPageId]: { ...currentPage, fullWidth: !isFullWidth } }));
                          }}
                        />
                      )}
                      label='Full Width'
                    />
                  </ListItemButton>
                </List>
              </Popover>
            </Box>
          )}

          {/** dark mode toggle */}
          {user && (
            <IconButton size='small' sx={{ mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
              <Tooltip title={`Enable ${theme.palette.mode === 'dark' ? 'light mode' : 'dark mode'}`} arrow placement='bottom'>
                {theme.palette.mode === 'dark' ? <SunIcon color='secondary' /> : <MoonIcon color='secondary' />}
              </Tooltip>
            </IconButton>
          )}
          <NotificationsBadge />
          {/** user account */}
          <Account />
        </Box>
      </Box>
    </StyledToolbar>
  );
}
