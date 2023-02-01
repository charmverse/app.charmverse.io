import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { MessageOutlined, RateReviewOutlined } from '@mui/icons-material';
import { Box, IconButton, Slide, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { memo } from 'react';

import PageActionToggle from 'components/[pageId]/DocumentPage/components/PageActionToggle';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { PageAction } from 'hooks/usePageActionDisplay';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';

const PageActionListBox = styled.div`
  position: fixed;
  right: 0px;
  width: 430px;
  max-width: 100%;
  top: 56px; // height of MUI Toolbar
  z-index: var(--z-index-drawer);
  height: calc(100% - 80px);
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(0, 1, 0, 3)};
  background: ${({ theme }) => theme.palette.background.default};
`;

export const SIDEBAR_VIEWS = {
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
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
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
      <PageActionListBox id={id}>
        <Box
          sx={{
            height: 'calc(100%)',
            gap: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box display='flex' gap={1} alignItems='center'>
            <PageActionToggle />
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {title}
            </Typography>
            <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
              <PageActionIcon view='comments' />
              <PageActionIcon view='suggestions' />
            </Box>
          </Box>

          {children}
        </Box>
      </PageActionListBox>
    </Slide>
  ) : (
    <MobileDialog
      title={title}
      open={open}
      onClose={() => setCurrentPageActionDisplay(null)}
      rightActions={
        <Box display='flex' alignItems='center' pr={1} justifyContent='flex-end'>
          <PageActionIcon view='comments' size='medium' />
          <PageActionIcon view='suggestions' size='medium' />
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

function PageActionIcon({ view, size = 'small' }: { view: PageAction; size?: 'small' | 'medium' }) {
  const { currentPageActionDisplay, setCurrentPageActionDisplay } = usePageActionDisplay();

  function setView() {
    setCurrentPageActionDisplay(view);
  }

  return (
    <Tooltip title={SIDEBAR_VIEWS[view].tooltip}>
      <IconButton color={currentPageActionDisplay === view ? 'inherit' : 'secondary'} size={size} onClick={setView}>
        {SIDEBAR_VIEWS[view].icon}
      </IconButton>
    </Tooltip>
  );
}

export const SidebarDrawer = memo(SidebarDrawerComponent);
