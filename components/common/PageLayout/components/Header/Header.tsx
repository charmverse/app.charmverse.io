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
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { memo, useMemo, useRef, useState } from 'react';

import charmClient from 'charmClient';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { undoEventName } from 'components/common/CharmEditor/utils';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { useColorMode } from 'context/darkMode';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePages } from 'hooks/usePages';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import { useToggleFavorite } from 'hooks/useToggleFavorite';
import { useUser } from 'hooks/useUser';

import NotificationsBadge from '../Sidebar/NotificationsBadge';

import BountyShareButton from './components/BountyShareButton/BountyShareButton';
import DatabasePageOptions from './components/DatabasePageOptions';
import { DocumentHistory } from './components/DocumentHistory';
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
        <ListItemButton data-test='delete-current-page' disabled={disabled} onClick={onClick}>
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
  const { formatDateTime } = useDateFormatter();

  return (
    <Stack
      sx={{
        mx: 2,
        my: 1
      }}
    >
      <Typography variant='subtitle2'>
        Last edited by <strong>{creator}</strong>
      </Typography>
      <Typography variant='subtitle2'>
        at <strong>{formatDateTime(lastUpdatedAt)}</strong>
      </Typography>
    </Stack>
  );
}

function PostHeader({
  setPageMenuOpen,
  undoEditorChanges,
  forumPostInfo
}: {
  forumPostInfo: ReturnType<typeof usePostByPath>;
  setPageMenuOpen: Dispatch<SetStateAction<boolean>>;
  undoEditorChanges: VoidFunction;
}) {
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showMessage } = useSnackbar();
  const { members } = useMembers();

  const router = useRouter();

  const canCreateProposal = !!userSpacePermissions?.createVote;

  const postCreator = members.find((member) => member.id === forumPostInfo.forumPost?.createdBy);

  function deletePost() {
    if (forumPostInfo.forumPost) {
      charmClient.forum.deleteForumPost(forumPostInfo.forumPost.id).then(() => {
        router.push(`/${router.query.domain}/forum`);
      });
    }
  }

  async function exportMarkdownPage() {
    if (forumPostInfo.forumPost) {
      exportMarkdown({
        content: forumPostInfo.forumPost.content,
        id: forumPostInfo.forumPost.id,
        members,
        spaceId: forumPostInfo.forumPost.spaceId,
        title: forumPostInfo.forumPost.title
      }).catch(() => {
        showMessage('Error exporting markdown', 'error');
      });
      setPageMenuOpen(false);
    }
  }

  function closeMenu() {
    setPageMenuOpen(false);
  }

  async function convertToProposal(pageId: string) {
    setPageMenuOpen(false);
    const { path } = await charmClient.forum.convertToProposal(pageId);
    router.push(`/${router.query.domain}/${path}`);
  }

  return (
    <List data-test='forum-post-actions' dense>
      <CopyLinkMenuItem closeMenu={closeMenu} />
      <Divider />
      <DeleteMenuItem onClick={deletePost} disabled={!forumPostInfo.permissions?.delete_post} />
      <UndoMenuItem onClick={undoEditorChanges} disabled={!forumPostInfo?.permissions?.edit_post} />
      <ExportMarkdownMenuItem onClick={exportMarkdownPage} />
      <Tooltip
        title={
          !canCreateProposal || forumPostInfo.forumPost?.proposalId
            ? 'You do not have the permission to convert to proposal'
            : ''
        }
      >
        <div>
          <ListItemButton
            data-test='forum-post-convert-proposal-action'
            onClick={() => forumPostInfo.forumPost && convertToProposal(forumPostInfo.forumPost.id)}
            disabled={!canCreateProposal || !!forumPostInfo.forumPost?.proposalId}
          >
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
      <Tooltip title={!forumPostInfo.permissions?.edit_post ? "You don't have permission to undo changes" : ''}>
        <div>
          <ListItemButton disabled={!forumPostInfo.permissions?.edit_post} onClick={undoEditorChanges}>
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
      <Divider />
      {forumPostInfo.forumPost && postCreator ? (
        <>
          <Divider />
          <DocumentHistory page={{ updatedBy: forumPostInfo.forumPost.createdBy, ...forumPostInfo.forumPost }} />
        </>
      ) : null}
    </List>
  );
}

function HeaderComponent({ open, openSidebar }: HeaderProps) {
  const router = useRouter();
  const colorMode = useColorMode();
  const { updatePage, getPagePermissions, deletePage } = usePages();
  const { user } = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();
  const { showMessage } = useSnackbar();
  const basePage = usePageFromPath();
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId: basePage?.id });
  const { members } = useMembers();
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const pagePermissions = basePage ? getPagePermissions(basePage.id) : null;

  const { onClick: clickToOpenSettingsModal } = useSettingsDialog();
  const isForumPost = router.route === '/[domain]/forum/post/[pagePath]';

  const pagePath = isForumPost ? (router.query.pagePath as string) : null;
  // Post permissions hook will not make an API call if post ID is null. Since we can't conditionally render hooks, we pass null as the post ID. This is the reason for the 'null as any' statement
  const forumPostInfo = usePostByPath({
    postPath: isForumPost ? pagePath : isForumPost ? (pagePath as string) : (null as any),
    spaceDomain: router.query.domain as string
  });

  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const pageType = basePage?.type;
  const isExportablePage =
    pageType === 'card' || pageType === 'page' || pageType === 'proposal' || pageType === 'bounty';

  const isBountyBoard = router.route === '/[domain]/bounties';
  const currentPageOrPost = basePage ?? forumPostInfo.forumPost;

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
        id: basePage.id,
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
    }
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
          <DocumentHistory page={basePage} />
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
  } else if (isForumPost) {
    pageOptionsList = (
      <PostHeader
        forumPostInfo={forumPostInfo}
        setPageMenuOpen={setPageMenuOpen}
        undoEditorChanges={undoEditorChanges}
      />
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
                    <MoreHorizIcon data-test='page-toplevel-menu' color='secondary' />
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
          {user && (
            <NotificationsBadge>
              <IconButton
                size={isLargeScreen ? 'small' : 'medium'}
                onClick={() => clickToOpenSettingsModal('notifications')}
              >
                <NotificationsIcon fontSize='small' color='secondary' />
              </IconButton>
            </NotificationsBadge>
          )}
          <IconButton
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            size='small'
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

          {/** user account */}
          {/* <Account /> */}
        </Box>
      </Box>
    </StyledToolbar>
  );
}

export const Header = memo(HeaderComponent);
