import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoonIcon from '@mui/icons-material/DarkMode';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import SunIcon from '@mui/icons-material/WbSunny';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { undoEventName } from 'components/common/CharmEditor/utils';
import { useColorMode } from 'context/darkMode';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useMembers } from 'hooks/useMembers';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import { useToggleFavorite } from 'hooks/useToggleFavorite';
import { useUser } from 'hooks/useUser';
import { humanFriendlyDate } from 'lib/utilities/dates';

import DocumentHistory from '../DocumentHistory';
import NotificationsBadge from '../Sidebar/NotificationsBadge';

import BountyShareButton from './components/BountyShareButton/BountyShareButton';
import DatabasePageOptions from './components/DatabasePageOptions';
import { DocumentParticipants } from './components/DocumentParticipants';
import EditingModeToggle from './components/EditingModeToggle';
import PageTitleWithBreadcrumbs from './components/PageTitleWithBreadcrumbs';
import ShareButton from './components/ShareButton';
import PublishToSnapshot from './components/Snapshot/PublishToSnapshot';
import { exportMarkdown } from './components/utils/exportMarkdown';

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

function CopyLinkMenuItem({ closeMenu }: { closeMenu: VoidFunction }) {
  const { showMessage } = useSnackbar();

  function onCopyLink() {
    Utils.copyTextToClipboard(window.location.href);
    showMessage('Copied link to clipboard', 'success');
    closeMenu();
  }

  return (
    <ListItemButton onClick={onCopyLink}>
      <ContentCopyIcon
        fontSize='small'
        sx={{
          mr: 1
        }}
      />
      <ListItemText primary='Copy link' />
    </ListItemButton>
  );
}

function DeleteMenuItem({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "You don't have permission to delete this page" : ''}>
      <div>
        <ListItemButton disabled={disabled} onClick={onClick}>
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
  );
}

function UndoMenuItem({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "You don't have permission to undo changes" : ''}>
      <div>
        <ListItemButton disabled={disabled} onClick={onClick}>
          <UndoIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary='Undo' />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}

export function ExportMarkdownMenuItem({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "This page can't be exported" : ''}>
      <div>
        <ListItemButton disabled={disabled} onClick={onClick}>
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
  );
}

export function Metadata({ creator, lastUpdatedAt }: { creator: string; lastUpdatedAt: Date }) {
  return (
    <Stack
      sx={{
        mx: 2,
        my: 1
      }}
    >
      <Typography variant='subtitle2'>Last edited by {creator}</Typography>
      <Typography variant='subtitle2'>Last edited at {humanFriendlyDate(lastUpdatedAt)}</Typography>
    </Stack>
  );
}

export default function Header({ open, openSidebar }: HeaderProps) {
  const router = useRouter();
  const colorMode = useColorMode();
  const { pages, updatePage, getPagePermissions, deletePage } = usePages();
  const currentSpace = useCurrentSpace();

  const { user } = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();
  const { showMessage } = useSnackbar();
  const basePageId = router.query.pageId as string;
  const basePage = Object.values(pages).find((page) => page?.id === basePageId || page?.path === basePageId);
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId: basePage?.id });
  const { members } = useMembers();
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const pagePermissions = basePage ? getPagePermissions(basePage.id) : null;

  const { onClick: clickToOpenSettingsModal, onTouchStart: touchStartToOpenSettingsModal } = useSettingsDialog();
  const isForumPost = router.route === '/[domain]/forum/post/[pagePath]';
  const pagePath = isForumPost ? (router.query.pagePath as string) : null;

  const { data: forumPost = null } = useSWR(currentSpace && pagePath ? `post-${pagePath}` : null, () =>
    charmClient.forum.getForumPost(pagePath!)
  );
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const pageType = basePage?.type;
  const isExportablePage =
    pageType === 'card' || pageType === 'page' || pageType === 'proposal' || pageType === 'bounty';

  const isBountyBoard = router.route === '/[domain]/bounties';
  const currentPageOrPost = basePage ?? forumPost;

  const undoEvent = useMemo(() => {
    if (currentPageOrPost) {
      return new CustomEvent(undoEventName, { detail: { pageId: currentPageOrPost.id } });
    }
    return null;
  }, [currentPageOrPost?.id]);

  const isFullWidth = !isLargeScreen || (basePage?.fullWidth ?? false);
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

  function deletePost() {
    if (forumPost) {
      charmClient.forum.deleteForumPost(forumPost.id).then(() => {
        router.push(`/${router.query.domain}/forum`);
      });
    }
  }

  async function undoEditorChanges() {
    if (currentPageOrPost) {
      // There might be multiple instances of bangle editor in the document
      const bangleEditorCoreElement = document.querySelector(
        `.bangle-editor-core[data-page-id="${currentPageOrPost.id}"]`
      );
      if (bangleEditorCoreElement) {
        bangleEditorCoreElement.dispatchEvent(undoEvent as Event);
      }
    }
    setPageMenuOpen(false);
  }

  const canCreateProposal = !!userSpacePermissions?.createVote;
  const charmversePage = basePage ? members.find((member) => member.id === basePage.createdBy) : null;

  async function convertToProposal(pageId: string) {
    setPageMenuOpen(false);
    await charmClient.pages.convertToProposal(pageId);
  }

  function closeMenu() {
    setPageMenuOpen(false);
  }

  async function exportMarkdownPage() {
    if (basePage) {
      const page = await charmClient.pages.getPage(basePage.id);
      exportMarkdown({
        content: page.content,
        id: page.id,
        members,
        spaceId: page.spaceId,
        title: page.title
      }).catch(() => {
        showMessage('Error exporting markdown', 'error');
      });
      setPageMenuOpen(false);
    } else if (forumPost) {
      exportMarkdown({
        content: forumPost.content,
        id: forumPost.id,
        members,
        spaceId: forumPost.spaceId,
        title: forumPost.title
      }).catch(() => {
        showMessage('Error exporting markdown', 'error');
      });
      setPageMenuOpen(false);
    }
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
      <Divider />
      {(basePage?.type === 'card' || basePage?.type === 'page') && (
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
      )}
      <CopyLinkMenuItem closeMenu={closeMenu} />
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
      <DeleteMenuItem onClick={onDeletePage} disabled={!pagePermissions?.delete || basePage?.deletedAt !== null} />
      <UndoMenuItem onClick={undoEditorChanges} disabled={!pagePermissions?.edit_content} />
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
      <ExportMarkdownMenuItem disabled={!isExportablePage} onClick={exportMarkdownPage} />
      {isLargeScreen && (
        <>
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
        </>
      )}
      {charmversePage && basePage && (
        <>
          <Divider />
          <Metadata creator={charmversePage.username} lastUpdatedAt={basePage.updatedAt} />
        </>
      )}
    </List>
  );

  let pageOptionsList: ReactNode;

  if (isBasePageDocument) {
    pageOptionsList = documentOptions;
  } else if (isBasePageDatabase && basePage) {
    pageOptionsList = (
      <DatabasePageOptions pagePermissions={pagePermissions ?? undefined} pageId={basePage.id} closeMenu={closeMenu} />
    );
  } else if (isForumPost && forumPost) {
    const postCreator = members.find((member) => member.id === forumPost.createdBy);

    const isPostCreator = forumPost.createdBy === user?.id;
    pageOptionsList = (
      <List dense>
        <CopyLinkMenuItem closeMenu={closeMenu} />
        <Divider />
        <DeleteMenuItem onClick={deletePost} disabled={!isPostCreator} />
        <UndoMenuItem onClick={undoEditorChanges} disabled={!isPostCreator} />
        <ExportMarkdownMenuItem onClick={exportMarkdownPage} />
        <Divider />
        {forumPost && postCreator && (
          <>
            <Divider />
            <Metadata creator={postCreator.username} lastUpdatedAt={forumPost.updatedAt} />
          </>
        )}
      </List>
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
          ...(open && isLargeScreen && { display: 'none' })
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
          width: { xs: 'calc(100% - 40px)', md: '100%' }
        }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <PageTitleWithBreadcrumbs pageId={basePage?.id} pageType={basePage?.type} />
        </div>

        <Box display='flex' alignItems='center' alignSelf='stretch' mr={-1} gap={0.25}>
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
                <Tooltip title='View comments, export content and more' arrow>
                  <IconButton
                    size={isLargeScreen ? 'small' : 'medium'}
                    onClick={() => {
                      setPageMenuOpen(!pageMenuOpen);
                      setPageMenuAnchorElement(pageMenuAnchor.current || null);
                    }}
                  >
                    <MoreHorizIcon color='secondary' />
                  </IconButton>
                </Tooltip>
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
            <>
              <NotificationsBadge>
                <IconButton
                  size={isLargeScreen ? 'small' : 'medium'}
                  onClick={(e) => clickToOpenSettingsModal(e, 'notifications')}
                  onTouchStart={(e) => touchStartToOpenSettingsModal(e, 'notifications')}
                >
                  <NotificationsIcon fontSize='small' color='secondary' />
                </IconButton>
              </NotificationsBadge>
              <IconButton
                size='small'
                sx={{ display: { xs: 'none', md: 'inline-flex' } }}
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
            </>
          )}
          {/* <NotificationsBadge /> */}
          {/** user account */}
          {/* <Account /> */}
        </Box>
      </Box>
    </StyledToolbar>
  );
}
