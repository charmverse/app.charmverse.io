import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { MessageOutlined, RateReviewOutlined } from '@mui/icons-material';
import { Box, IconButton, Slide, SvgIcon, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { RiChatCheckLine } from 'react-icons/ri';

import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { PageSidebarView } from 'hooks/usePageSidebar';

import { PageSidebarViewToggle } from './PageSidebarViewToggle';

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
    icon: <SvgIcon component={RiChatCheckLine} fontSize='small' sx={{ mb: '1px' }} />,
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

function DocumentSidebarComponent({
  children,
  id,
  sidebarView,
  openSidebar,
  closeSidebar,
  showEvaluation,
  title
}: {
  children: ReactNode;
  id: string;
  sidebarView: PageSidebarView | null;
  openSidebar: (view: PageSidebarView) => void;
  closeSidebar: () => void;
  showEvaluation: boolean;
  title: string;
}) {
  const isMdScreen = useMdScreen();
  const theme = useTheme();
  const isOpen = sidebarView !== null;

  function togglePageSidebar() {
    if (sidebarView === null) {
      openSidebar('comments');
    } else {
      closeSidebar();
    }
  }
  return isMdScreen ? (
    <Slide
      appear={false}
      direction='left'
      in={isOpen}
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
            <PageSidebarViewToggle onClick={togglePageSidebar} />
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {title}
            </Typography>
            <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
              {showEvaluation && (
                <SidebarViewIcon view='proposal_evaluation' activeView={sidebarView} onClick={openSidebar} />
              )}
              <SidebarViewIcon view='comments' activeView={sidebarView} onClick={openSidebar} />
              <SidebarViewIcon view='suggestions' activeView={sidebarView} onClick={openSidebar} />
            </Box>
          </Box>
          {children}
        </Box>
      </DesktopSidebarHeader>
    </Slide>
  ) : (
    <MobileDialog
      title={title}
      open={isOpen}
      onClose={closeSidebar}
      rightActions={
        <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
          {showEvaluation && (
            <SidebarViewIcon view='proposal_evaluation' size='medium' activeView={sidebarView} onClick={openSidebar} />
          )}
          <SidebarViewIcon view='comments' size='medium' activeView={sidebarView} onClick={openSidebar} />
          <SidebarViewIcon view='suggestions' size='medium' activeView={sidebarView} onClick={openSidebar} />
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

function SidebarViewIcon({
  view,
  activeView,
  size = 'small',
  onClick
}: {
  activeView: PageSidebarView | null;
  view: PageSidebarView;
  size?: 'small' | 'medium';
  onClick: (view: PageSidebarView) => void;
}) {
  return (
    <Tooltip title={SIDEBAR_VIEWS[view].tooltip}>
      <IconButton color={activeView === view ? 'inherit' : 'secondary'} size={size} onClick={() => onClick(view)}>
        {SIDEBAR_VIEWS[view].icon}
      </IconButton>
    </Tooltip>
  );
}

export const DocumentSidebar = memo(DocumentSidebarComponent);
