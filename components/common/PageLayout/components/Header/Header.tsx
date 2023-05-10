import type { PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { useRouter } from 'next/router';
import { memo } from 'react';

import { documentTypes } from 'components/common/PageActions/components/DocumentPageActionList';
import { FullPageActionsMenuButton } from 'components/common/PageActions/FullPageActionsMenuButton';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { usePageFromPath } from 'hooks/usePageFromPath';
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

  const basePage = usePageFromPath();
  // Post permissions hook will not make an API call if post ID is null. Since we can't conditionally render hooks, we pass null as the post ID. This is the reason for the 'null as any' statement
  const forumPostInfo = usePostByPath();
  const isBountyBoard = router.route === '/[domain]/bounties';
  const isBasePageDocument = documentTypes.includes(basePage?.type as PageType);

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

          <FullPageActionsMenuButton page={basePage} post={forumPostInfo?.forumPost} />

          {user && <NotificationButton />}
        </Box>
      </Box>
    </StyledToolbar>
  );
}

export const Header = memo(HeaderComponent);
