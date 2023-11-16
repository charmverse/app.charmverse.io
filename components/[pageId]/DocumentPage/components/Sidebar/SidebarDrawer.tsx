import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Grading, MessageOutlined, RateReviewOutlined } from '@mui/icons-material';
import { Box, IconButton, Slide, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { PageSidebarViewToggle } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebarViewToggle';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { PageSidebarView } from 'hooks/usePageSidebar';
import { usePageSidebar } from 'hooks/usePageSidebar';

const DesktopSidebarHeader = styled.div`
  position: fixed;
  right: 0px;
  width: 430px;
  max-width: 100%;
  top: 56px; // height of MUI Toolbar
  z-index: var(--z-index-drawer);
  height: calc(100% - 80px);
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(0, 1)};
  background: ${({ theme }) => theme.palette.background.default};
`;

export const SIDEBAR_VIEWS = {
  proposal_evaluation: {
    icon: <Grading fontSize='small' />,
    tooltip: 'View rubric evaluation',
    title: 'Evaluation'
  },
  comments: {
    icon: <MessageOutlined fontSize='small' />,
    tooltip: 'View comments',
    title: 'Comments'
  },
  suggestions: {
    icon: <RateReviewOutlined fontSize='small' />,
    tooltip: 'View suggestions',
    title: 'Suggestions'
  }
} as const;

function SidebarDrawerComponent({
  children,
  id,
  open,
  title
}: {
  children: ReactNode;
  id: string;
  open: boolean;
  title: string;
}) {
  const { setActiveView } = usePageSidebar();
  const isMdScreen = useMdScreen();
  const theme = useTheme();

  return isMdScreen ? (
    <Slide
      appear={false}
      direction='left'
      in={open}
      style={{
        transformOrigin: 'left top'
      }}
      easing={{
        enter: 'ease-in',
        exit: 'ease-out'
      }}
      timeout={250}
    >
      <DesktopSidebarHeader id={id}>
        <Box
          sx={{
            height: 'calc(100%)',
            gap: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box display='flex' gap={1} alignItems='center'>
            <PageSidebarViewToggle />
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {title}
            </Typography>
            <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
              <SidebarViewIcon view='proposal_evaluation' />
              <SidebarViewIcon view='comments' />
              <SidebarViewIcon view='suggestions' />
            </Box>
          </Box>

          {children}
        </Box>
      </DesktopSidebarHeader>
    </Slide>
  ) : (
    <MobileDialog
      title={title}
      open={open}
      onClose={() => setActiveView(null)}
      rightActions={
        <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
          <SidebarViewIcon view='proposal_evaluation' size='medium' />
          <SidebarViewIcon view='comments' size='medium' />
          <SidebarViewIcon view='suggestions' size='medium' />
        </Box>
      }
      PaperProps={{ sx: { background: theme.palette.background.light } }}
      contentSx={{ pr: 0, pb: 0, pl: 1 }}
    >
      <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
        {children}
      </Box>
    </MobileDialog>
  );
}

function SidebarViewIcon({ view, size = 'small' }: { view: PageSidebarView; size?: 'small' | 'medium' }) {
  const { activeView, setActiveView } = usePageSidebar();

  function setView() {
    setActiveView(view);
  }

  return (
    <Tooltip title={SIDEBAR_VIEWS[view].tooltip}>
      <IconButton color={activeView === view ? 'inherit' : 'secondary'} size={size} onClick={setView}>
        {SIDEBAR_VIEWS[view].icon}
      </IconButton>
    </Tooltip>
  );
}

export const SidebarDrawer = memo(SidebarDrawerComponent);
