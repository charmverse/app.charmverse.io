import MenuIcon from '@mui/icons-material/Menu';
import { styled, Badge } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { useRouter } from 'next/router';
import { memo } from 'react';

import { FullPageActionsMenuButton } from 'components/common/PageActions/FullPageActionsMenuButton';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePageIdFromPath } from 'hooks/usePageFromPath';

import { DocumentHeaderElements } from './components/DocumentHeaderElements';
import { PageTitleWithBreadcrumbs } from './components/PageTitleWithBreadcrumbs';
import ProposalShareButton from './components/ProposalsShareButton/ProposalsShareButton';
import RewardsShareButton from './components/RewardsShareButton/RewardsShareButton';

export const headerHeight = 56;

export const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

export const HeaderSpacer = styled('div')`
  min-height: ${headerHeight}px;
`;

type HeaderProps = {
  open: boolean;
  openSidebar: () => void;
};

function HeaderComponent({ open, openSidebar }: HeaderProps) {
  const router = useRouter();
  const basePageId = usePageIdFromPath();
  const { space: currentSpace } = useCurrentSpace();
  const { page: basePage } = usePage({
    pageIdOrPath: currentSpace ? basePageId : undefined,
    spaceId: currentSpace?.id
  });
  const { unreadNotifications } = useNotifications();
  // Post permissions hook will not make an API call if post ID is null. Since we can't conditionally render hooks, we pass null as the post ID. This is the reason for the 'null as any' statement
  const forumPostInfo = usePostByPath();
  const isRewardsList = router.route === '/[domain]/rewards';
  const isProposalsPage = router.route === '/[domain]/proposals';

  return (
    <StyledToolbar variant='dense'>
      <ToggleSidebarIcon open={open} openSidebar={openSidebar} badgeContent={unreadNotifications.length} />

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
          <PageTitleWithBreadcrumbs pageId={basePage?.id} pageMeta={basePage} pageType={basePage?.type} />
        </div>

        <Box display='flex' alignItems='center' alignSelf='stretch' mr={-1} gap={0.5}>
          {isRewardsList && <RewardsShareButton headerHeight={headerHeight} />}
          {isProposalsPage && <ProposalShareButton headerHeight={headerHeight} />}
          {basePage && <DocumentHeaderElements headerHeight={headerHeight} page={basePage} />}

          <FullPageActionsMenuButton page={basePage} post={forumPostInfo?.forumPost} />
        </Box>
      </Box>
    </StyledToolbar>
  );
}

export function ToggleSidebarIcon({
  open,
  openSidebar,
  badgeContent
}: {
  open: boolean;
  openSidebar: VoidFunction;
  badgeContent?: number;
}) {
  return (
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
      <Badge badgeContent={badgeContent} color='error'>
        <MenuIcon />
      </Badge>
    </IconButton>
  );
}

export const Header = memo(HeaderComponent);
