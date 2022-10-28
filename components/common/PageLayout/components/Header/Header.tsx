import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { RateReviewOutlined } from '@mui/icons-material';
import MoonIcon from '@mui/icons-material/DarkMode';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GetAppIcon from '@mui/icons-material/GetApp';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import SunIcon from '@mui/icons-material/WbSunny';
import { Divider, FormControlLabel, Switch, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import charmClient from 'charmClient';
import PublishToSnapshot from 'components/common/PageLayout/components/Header/components/Snapshot/PublishToSnapshot';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import { useColorMode } from 'context/darkMode';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { generateMarkdown } from 'lib/pages/generateMarkdown';

import BountyShareButton from './components/BountyShareButton/BountyShareButton';
import DatabasePageOptions from './components/DatabasePageOptions';
import EditingModeToggle from './components/EditingModeToggle';
import PageTitleWithBreadcrumbs from './components/PageTitleWithBreadcrumbs';
import ShareButton from './components/ShareButton';

export const headerHeight = 56;

export const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

interface HeaderProps {
  open: boolean;
  openSidebar: () => void;
}

const documentTypes = ['page', 'card', 'proposal', 'proposal_template', 'bounty'];

export default function Header ({ open, openSidebar }: HeaderProps) {

  const router = useRouter();
  const colorMode = useColorMode();
  const { pages, updatePage, getPagePermissions } = usePages();
  const { user, setUser } = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const basePageId = router.query.pageId as string;
  const basePage = Object.values(pages).find(page => page?.id === basePageId || page?.path === basePageId);

  const pagePermissions = getPagePermissions(basePageId);

  const isFavorite = basePage && user?.favorites.some(({ pageId }) => pageId === basePage.id);
  const pageType = basePage?.type;
  const isExportablePage = pageType === 'card' || pageType === 'page' || pageType === 'proposal';

  const isBountyBoard = router.route === '/[domain]/bounties';

  async function toggleFavorite () {
    if (!basePage || !user) return;
    const pageId = basePage.id;
    const updatedFields = isFavorite
      ? await charmClient.unfavoritePage(pageId)
      : await charmClient.favoritePage(pageId);
    setUser({ ...user, ...updatedFields });
  }

  async function exportMarkdown () {
    if (!basePage) {
      return;
    }

    // getPage to get content
    const page = await charmClient.pages.getPage(basePage.id);
    const markdownContent = await generateMarkdown(page);

    if (markdownContent) {
      const data = new Blob([markdownContent], { type: 'text/plain' });

      const linkElement = document.createElement('a');

      linkElement.download = `${basePage?.title || 'page'}.md`;

      const downloadLink = URL.createObjectURL(data);

      linkElement.href = downloadLink;

      linkElement.click();

      URL.revokeObjectURL(downloadLink);
    }
  }

  const isFullWidth = basePage?.fullWidth ?? false;
  const isBasePageDocument = documentTypes.includes(basePage?.type ?? '');
  const isBasePageDatabase = /board/.test(basePage?.type ?? '');

  const onSwitchChange = () => {
    if (basePage) {
      updatePage({
        id: basePage?.id,
        fullWidth: !isFullWidth
      });
    }
  };

  const documentOptions = (
    <List dense>
      {pagePermissions?.create_poll && (
        <ListItemButton
          onClick={() => {
            setPageMenuOpen(false);
            setIsModalOpen(true);
          }}
        >
          <HowToVoteOutlinedIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary='Create a poll' />
        </ListItemButton>
      )}
      <ListItemButton
        onClick={() => {
          setCurrentPageActionDisplay('polls');
          setPageMenuOpen(false);
        }}
      >
        <FormatListBulletedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View polls' />
      </ListItemButton>
      {basePage && (
        <PublishToSnapshot
          pageId={basePage.id}
          renderContent={({ label, onClick, icon }) => (
            <ListItemButton onClick={onClick}>
              {icon}
              <ListItemText primary={label} />
            </ListItemButton>
          )}
        />
      )}
      <Divider />
      <ListItemButton onClick={() => {
        setCurrentPageActionDisplay('comments');
        setPageMenuOpen(false);
      }}
      >
        <MessageOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View comments' />
      </ListItemButton>
      <ListItemButton onClick={() => {
        setCurrentPageActionDisplay('suggestions');
        setPageMenuOpen(false);
      }}
      >
        <RateReviewOutlined
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View suggestions' />
      </ListItemButton>
      {isExportablePage && (
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
      )}

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
              onChange={onSwitchChange}
            />
          )}
          label={<Typography variant='body2'>Full Width</Typography>}
        />
      </ListItemButton>
    </List>
  );

  function closeMenu () {
    setPageMenuOpen(false);
  }

  let pageOptionsList: ReactNode;

  if (isBasePageDocument) {
    pageOptionsList = documentOptions;
  }
  else if (isBasePageDatabase) {
    pageOptionsList = <DatabasePageOptions closeMenu={closeMenu} />;
  }

  return (
    <StyledToolbar variant='dense'>
      <IconButton
        color='inherit'
        onClick={openSidebar}
        edge='start'
        sx={{
          display: 'inline-flex',
          mr: 2,
          ...(open && { display: 'none' })
        }}
      >
        <MenuIcon />
      </IconButton>

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 1,
        width: '100%'
      }}
      >
        <PageTitleWithBreadcrumbs pageId={basePage?.id} pageType={basePage?.type} />
        <Box display='flex' alignItems='center' alignSelf='stretch' mr={-1}>

          {
            isBountyBoard && (
              <BountyShareButton headerHeight={headerHeight} />
            )
          }

          {basePage && (
            <>
              {isBasePageDocument && <EditingModeToggle />}
              {basePage?.deletedAt === null && (
                <ShareButton headerHeight={headerHeight} pageId={basePage.id} />
              )}
              <IconButton sx={{ display: { xs: 'none', md: 'inline-flex' } }} size='small' onClick={toggleFavorite} color='inherit'>
                <Tooltip title={isFavorite ? 'Remove from sidebar' : 'Pin this page to your sidebar'} arrow placement='top'>
                  {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
                </Tooltip>
              </IconButton>
            </>
          )}

          {pageOptionsList && (
            <Box ml={1} ref={pageMenuAnchor} display='flex' alignSelf='stretch' alignItems='center'>
              <div>
                <IconButton
                  size='small'
                  onClick={() => {
                    setPageMenuOpen(!pageMenuOpen);
                    setPageMenuAnchorElement(pageMenuAnchor.current || null);
                  }}
                >
                  <Tooltip title='View comments, polls, export content and more' arrow>
                    <MoreHorizIcon color='secondary' />
                  </Tooltip>
                </IconButton>
              </div>
              <Popover
                anchorEl={pageMenuAnchorElement}
                open={pageMenuOpen}
                onClose={() => setPageMenuOpen(false)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                {pageOptionsList}
              </Popover>
            </Box>
          )}
          {/** End of CharmEditor page specific header content */}

          {/** dark mode toggle */}
          {user && (
            <IconButton size='small' sx={{ display: { xs: 'none', md: 'inline-flex' }, mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
              <Tooltip title={`Enable ${theme.palette.mode === 'dark' ? 'light mode' : 'dark mode'}`} arrow placement='top'>
                {theme.palette.mode === 'dark' ? <SunIcon fontSize='small' color='secondary' /> : <MoonIcon fontSize='small' color='secondary' />}
              </Tooltip>
            </IconButton>
          )}
          {/* <NotificationsBadge /> */}
          {/** user account */}
          {/* <Account /> */}
        </Box>
      </Box>
      {/** inject the modal based on open status so it resets the form each time */}
      {isModalOpen && (
        <CreateVoteModal
          open={isModalOpen}
          onCreateVote={() => {
            setIsModalOpen(false);
          }}
          onClose={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </StyledToolbar>
  );
}
