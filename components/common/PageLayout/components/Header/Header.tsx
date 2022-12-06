import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoonIcon from '@mui/icons-material/DarkMode';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import SunIcon from '@mui/icons-material/WbSunny';
import { Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
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
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { useColorMode } from 'context/darkMode';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useMembers } from 'hooks/useMembers';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useToggleFavorite } from 'hooks/useToggleFavorite';
import { useUser } from 'hooks/useUser';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { humanFriendlyDate } from 'lib/utilities/dates';

import DocumentHistory from '../DocumentHistory';

import BountyShareButton from './components/BountyShareButton/BountyShareButton';
import DatabasePageOptions from './components/DatabasePageOptions';
import { DocumentParticipants } from './components/DocumentParticipants';
import EditingModeToggle from './components/EditingModeToggle';
import PageTitleWithBreadcrumbs from './components/PageTitleWithBreadcrumbs';
import ShareButton from './components/ShareButton';
import PublishToSnapshot from './components/Snapshot/PublishToSnapshot';

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

export default function Header({ open, openSidebar }: HeaderProps) {
  const router = useRouter();
  const colorMode = useColorMode();
  const { pages, updatePage, getPagePermissions, deletePage } = usePages();
  const { user } = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();
  const { showMessage } = useSnackbar();
  const basePageId = router.query.pageId as string;
  const basePage = Object.values(pages).find((page) => page?.id === basePageId || page?.path === basePageId);
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId: basePage?.id });

  const pagePermissions = basePage ? getPagePermissions(basePage.id) : null;

  const pageType = basePage?.type;
  const isExportablePage =
    pageType === 'card' || pageType === 'page' || pageType === 'proposal' || pageType === 'bounty';

  const isBountyBoard = router.route === '/[domain]/bounties';

  async function exportMarkdown() {
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

  async function onDeletePage() {
    if (basePage) {
      await deletePage({
        pageId: basePage.id
      });
      if (basePage.type === 'board') {
        await charmClient.deleteBlock(basePage.id, () => {});
      }
    }
  }

  const { members } = useMembers();
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const canCreateProposal = !!userSpacePermissions?.createVote;
  const pageCreator = basePage ? members.find((member) => member.id === basePage.createdBy) : null;

  function onCopyLink() {
    Utils.copyTextToClipboard(window.location.href);
    showMessage('Copied link to clipboard', 'success');
    setPageMenuOpen(false);
  }

  async function convertToProposal(pageId: string) {
    setPageMenuOpen(false);
    await charmClient.pages.convertToProposal(pageId);
  }

  const documentOptions = (
    <List dense>
      <ListItemButton
        onClick={() => {
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

      <ListItemButton
        onClick={() => {
          setCurrentPageActionDisplay('suggestions');
          setPageMenuOpen(false);
        }}
      >
        <RateReviewOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View suggestions' />
      </ListItemButton>
      <ListItemButton
        onClick={() => {
          setCurrentPageActionDisplay('polls');
          setPageMenuOpen(false);
        }}
      >
        <FormatListBulletedOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View polls' />
      </ListItemButton>
      <Divider />
      <ListItemButton
        onClick={() => {
          toggleFavorite();
          setPageMenuOpen(false);
        }}
      >
        <Box
          sx={{
            mr: 0.5,
            position: 'relative',
            left: -4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isFavorite ? <FavoritedIcon /> : <NotFavoritedIcon />}
        </Box>
        <ListItemText primary={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} />
      </ListItemButton>
      <ListItemButton onClick={onCopyLink}>
        <ContentCopyIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='Copy link' />
      </ListItemButton>
      <Divider />
      {(basePage?.type === 'card' || basePage?.type === 'page') && (
        <>
          <Tooltip title={!canCreateProposal ? 'You do not have the permission to convert to proposal' : ''}>
            <div>
              <ListItemButton onClick={() => convertToProposal(basePage.id)} disabled={!canCreateProposal}>
                <TaskOutlinedIcon
                  fontSize='small'
                  sx={{
                    mr: 1
                  }}
                />
                <ListItemText primary='Convert to proposal' />
              </ListItemButton>
            </div>
          </Tooltip>
          <Divider />
        </>
      )}
      <Tooltip title={!pagePermissions?.delete ? "You don't have permission to delete this page" : ''}>
        <div>
          <ListItemButton disabled={!pagePermissions?.delete || basePage?.deletedAt !== null} onClick={onDeletePage}>
            <DeleteOutlineOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Delete' />
          </ListItemButton>
        </div>
      </Tooltip>
      <Divider />
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
      <Tooltip title={!isExportablePage ? "This page can't be exported" : ''}>
        <div>
          <ListItemButton
            disabled={!isExportablePage}
            onClick={() => {
              exportMarkdown();
              setPageMenuOpen(false);
            }}
          >
            <GetAppOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Export to markdown' />
          </ListItemButton>
        </div>
      </Tooltip>
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
          control={<Switch size='small' checked={isFullWidth} onChange={onSwitchChange} />}
          label={<Typography variant='body2'>Full Width</Typography>}
        />
      </ListItemButton>
      {pageCreator && basePage && (
        <>
          <Divider />
          <Stack
            sx={{
              mx: 2,
              my: 1
            }}
          >
            <Typography variant='subtitle2'>Last edited by {pageCreator.username}</Typography>
            <Typography variant='subtitle2'>Last edited at {humanFriendlyDate(basePage.updatedAt)}</Typography>
          </Stack>
        </>
      )}
    </List>
  );

  function closeMenu() {
    setPageMenuOpen(false);
  }

  let pageOptionsList: ReactNode;

  if (isBasePageDocument) {
    pageOptionsList = documentOptions;
  } else if (isBasePageDatabase) {
    pageOptionsList = (
      <DatabasePageOptions pagePermissions={pagePermissions ?? undefined} pageId={basePage?.id} closeMenu={closeMenu} />
    );
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

      <Box
        sx={{
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
          {isBountyBoard && <BountyShareButton headerHeight={headerHeight} />}

          {basePage && (
            <>
              {isBasePageDocument && <DocumentParticipants />}
              <DocumentHistory page={basePage} />
              {isBasePageDocument && <EditingModeToggle />}
              {basePage?.deletedAt === null && <ShareButton headerHeight={headerHeight} pageId={basePage.id} />}
            </>
          )}

          {pageOptionsList && (
            <Box ref={pageMenuAnchor} display='flex' alignSelf='stretch' alignItems='center'>
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
            <IconButton
              size='small'
              sx={{ display: { xs: 'none', md: 'inline-flex' }, mx: 1 }}
              onClick={colorMode.toggleColorMode}
              color='inherit'
            >
              <Tooltip
                title={`Enable ${theme.palette.mode === 'dark' ? 'light mode' : 'dark mode'}`}
                arrow
                placement='top'
              >
                {theme.palette.mode === 'dark' ? (
                  <SunIcon fontSize='small' color='secondary' />
                ) : (
                  <MoonIcon fontSize='small' color='secondary' />
                )}
              </Tooltip>
            </IconButton>
          )}
          {/* <NotificationsBadge /> */}
          {/** user account */}
          {/* <Account /> */}
        </Box>
      </Box>
    </StyledToolbar>
  );
}
