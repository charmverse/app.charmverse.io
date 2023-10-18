import type { PageType } from '@charmverse/core/prisma';
import { useTheme } from '@emotion/react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Tooltip, Popover, IconButton } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import { undoEventName } from 'components/common/CharmEditor/utils';
import { DatabasePageActionList } from 'components/common/PageActions/components/DatabasePageActionList';
import type { PageActionMeta } from 'components/common/PageActions/components/DocumentPageActionList';
import { DocumentPageActionList, documentTypes } from 'components/common/PageActions/components/DocumentPageActionList';
import { ForumPostActionList } from 'components/common/PageActions/components/ForumPostActionList';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePostPermissions } from 'hooks/usePostPermissions';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';

type Props = {
  pageId?: string;
  page?: PageActionMeta | null;
  post?: PostWithVotes | null;
  onDelete?: VoidFunction;
};

export function FullPageActionsMenuButton({ pageId, page: pageProp, post, onDelete }: Props) {
  let pageOptionsList: ReactNode = null;
  const router = useRouter();
  const { page: pageFromId } = usePage({ pageIdOrPath: pageId });
  const pageMenuAnchor = useRef();
  const isForumPost = !!post || router.route === '/[domain]/forum/post/[pagePath]';
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const { permissions: pagePermissions } = usePagePermissions({
    pageIdOrPath: pageId || (pageProp ? pageProp.id : null)
  });
  const postPermissions = usePostPermissions({
    postIdOrPath: post?.id,
    isNewPost: !post
  });
  const currentPageOrPostId = pageId ?? pageProp?.id ?? post?.id;

  const page = pageFromId || pageProp;

  const isBasePageDocument = documentTypes.includes(page?.type as PageType);
  const isBasePageDatabase = /board/.test(page?.type ?? '');

  const undoEvent = useMemo(() => {
    if (currentPageOrPostId) {
      return new CustomEvent(undoEventName, { detail: { pageId: currentPageOrPostId } });
    }
    return null;
  }, [currentPageOrPostId]);

  function closeMenu() {
    setPageMenuAnchorElement(null);
  }

  async function undoEditorChanges() {
    if (currentPageOrPostId) {
      // There might be multiple instances of bangle editor in the document
      const bangleEditorCoreElement = document.querySelector(
        `.bangle-editor-core[data-page-id="${currentPageOrPostId}"]`
      );
      if (bangleEditorCoreElement) {
        bangleEditorCoreElement.dispatchEvent(undoEvent as Event);
      }
    }
    closeMenu();
  }

  if (isBasePageDocument && page) {
    pageOptionsList = (
      <DocumentPageActionList
        page={page}
        pagePermissions={pagePermissions}
        onComplete={closeMenu}
        onDelete={onDelete}
        undoEditorChanges={undoEditorChanges}
      />
    );
  } else if (isBasePageDatabase && page) {
    pageOptionsList = <DatabasePageActionList page={page} pagePermissions={pagePermissions} onComplete={closeMenu} />;
  } else if (isForumPost && post) {
    pageOptionsList = (
      <ForumPostActionList
        post={post}
        onDelete={onDelete}
        postPermissions={postPermissions}
        onComplete={closeMenu}
        undoEditorChanges={undoEditorChanges}
      />
    );
  }

  if (isBasePageDocument || isBasePageDatabase || isForumPost) {
    return (
      <Box ref={pageMenuAnchor} display='flex' alignSelf='stretch' alignItems='center'>
        <div>
          <Tooltip title='View comments, export content and more' arrow>
            <IconButton
              size={isLargeScreen ? 'small' : 'medium'}
              onClick={() => {
                setPageMenuAnchorElement(pageMenuAnchor.current || null);
              }}
            >
              <MoreHorizIcon data-test='header--show-page-actions' color='secondary' />
            </IconButton>
          </Tooltip>
        </div>
        <Popover
          anchorEl={pageMenuAnchorElement}
          open={!!pageMenuAnchorElement}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
        >
          {pageOptionsList}
        </Popover>
      </Box>
    );
  }

  return null;
}
