import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
import { DuplicatePageAction } from 'components/common/DuplicatePageAction';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useMembers } from 'hooks/useMembers';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePagePermissions } from 'hooks/usePagePermissions';
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
        <ListItemButton data-test='header--delete-current-page' disabled={disabled} onClick={onClick}>
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

function PostHeader({
  setPageMenuOpen,
  undoEditorChanges,
  forumPostInfo
}: {
  forumPostInfo: ReturnType<typeof usePostByPath>;
  setPageMenuOpen: Dispatch<SetStateAction<boolean>>;
  undoEditorChanges: VoidFunction;
}) {
  const { showMessage } = useSnackbar();
  const { members } = useMembers();

  const router = useRouter();

  const { getCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const proposalCategoriesWithCreateAllowed = getCategoriesWithCreatePermission();

  const canCreateProposal = proposalCategoriesWithCreateAllowed.length > 0;

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
    const { path } = await charmClient.forum.convertToProposal({
      postId: pageId,
      categoryId: getDefaultCreateCategory()?.id
    });
    router.push(`/${router.query.domain}/${path}`);
  }

  return (
    <List data-test='header--forum-post-actions' dense>
      <CopyLinkMenuItem closeMenu={closeMenu} />
      <Divider />
      <DeleteMenuItem onClick={deletePost} disabled={!forumPostInfo.permissions?.delete_post} />
      <UndoMenuItem onClick={undoEditorChanges} disabled={!forumPostInfo?.permissions?.edit_post} />
      <Divider />
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
            data-test='convert-proposal-action'
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
  const { updatePage, deletePage } = usePages();
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
  const { permissions: pagePermissions } = usePagePermissions({
    pageIdOrPath: basePage ? basePage.id : (null as any)
  });
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

  const { getCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const proposalCategoriesWithCreateAllowed = getCategoriesWithCreatePermission();

  const canCreateProposal = proposalCategoriesWithCreateAllowed.length > 0;

  function closeMenu() {
    setPageMenuOpen(false);
    setPageMenuAnchorElement(null);
  }

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
      closeMenu();
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
    closeMenu();
  }

  const charmversePage = basePage ? members.find((member) => member.id === basePage.createdBy) : null;

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
    const convertedProposal = await charmClient.pages.convertToProposal({
      categoryId: getDefaultCreateCategory().id,
      pageId
    });
    closeMenu();
    router.push(`/${router.query.domain}/${convertedProposal.path}`);
  }

  const documentOptions = (
    <List data-test='header--page-actions' dense>
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
      {basePage && (
        <DuplicatePageAction postDuplication={closeMenu} page={basePage} pagePermissions={pagePermissions} />
      )}
      <CopyLinkMenuItem closeMenu={closeMenu} />

      <Divider />
      {(basePage?.type === 'card' || basePage?.type === 'page') && (
        <>
          <Tooltip title={!canCreateProposal ? 'You do not have the permission to convert to proposal' : ''}>
            <div>
              <ListItemButton
                data-test='convert-proposal-action'
                onClick={() => convertToProposal(basePage.id)}
                disabled={!canCreateProposal || !!basePage.convertedProposalId}
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
                    <MoreHorizIcon data-test='header--show-page-actions' color='secondary' />
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
        </Box>
      </Box>
    </StyledToolbar>
  );
}

export const Header = memo(HeaderComponent);
