import type { PageType } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Popover } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { memo, useMemo, useRef, useState } from 'react';

import { undoEventName } from 'components/common/CharmEditor/utils';
import { DatabasePageActionList } from 'components/common/PageActions/components/DatabasePageActionList';
import { DocumentPageActionList, documentTypes } from 'components/common/PageActions/components/DocumentPageActionList';
import { ForumPostActionList } from 'components/common/PageActions/components/ForumPostActionList';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { useUser } from 'hooks/useUser';

import BountyShareButton from './components/BountyShareButton/BountyShareButton';
import { DocumentParticipants } from './components/DocumentParticipants';
import EditingModeToggle from './components/EditingModeToggle';
import { NotificationButton } from './components/NotificationPreview/NotificationButton';
import PageTitleWithBreadcrumbs from './components/PageTitleWithBreadcrumbs';
import ShareButton from './components/ShareButton';

export const headerHeight = 56;

export const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

type HeaderProps = {
  open: boolean;
  openSidebar: () => void;
};

function HeaderComponent({ open, openSidebar }: HeaderProps) {
  const router = useRouter();
  const { user } = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();
  const basePage = usePageFromPath();
  const { permissions: pagePermissions } = usePagePermissions({
    pageIdOrPath: basePage ? basePage.id : (null as any)
  });
  const isForumPost = router.route === '/[domain]/forum/post/[pagePath]';

  // Post permissions hook will not make an API call if post ID is null. Since we can't conditionally render hooks, we pass null as the post ID. This is the reason for the 'null as any' statement
  const forumPostInfo = usePostByPath();

  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const isBountyBoard = router.route === '/[domain]/bounties';
  const currentPageOrPost = basePage ?? forumPostInfo.forumPost;

  const undoEvent = useMemo(() => {
    if (currentPageOrPost) {
      return new CustomEvent(undoEventName, { detail: { pageId: currentPageOrPost.id } });
    }
    return null;
  }, [currentPageOrPost?.id]);

  const isBasePageDocument = documentTypes.includes(basePage?.type as PageType);
  const isBasePageDatabase = /board/.test(basePage?.type ?? '');

  function closeMenu() {
    setPageMenuOpen(false);
    setPageMenuAnchorElement(null);
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

  let pageOptionsList: ReactNode;

  if (isBasePageDocument && basePage) {
    pageOptionsList = (
      <DocumentPageActionList pagePermissions={pagePermissions ?? undefined} page={basePage} closeMenu={closeMenu} />
    );
  } else if (isBasePageDatabase && basePage) {
    pageOptionsList = (
      <DatabasePageActionList pagePermissions={pagePermissions ?? undefined} page={basePage} closeMenu={closeMenu} />
    );
  } else if (isForumPost) {
    pageOptionsList = (
      <ForumPostActionList forumPostInfo={forumPostInfo} closeMenu={closeMenu} undoEditorChanges={undoEditorChanges} />
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

          {user && <NotificationButton />}
        </Box>
      </Box>
    </StyledToolbar>
  );
}

export const Header = memo(HeaderComponent);
