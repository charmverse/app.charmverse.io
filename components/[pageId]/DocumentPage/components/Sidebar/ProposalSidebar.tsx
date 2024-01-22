import styled from '@emotion/styled';
import { Box, Drawer, Collapse, Typography } from '@mui/material';
import { memo } from 'react';

import type { ProposalEvaluationsProps } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { useMdScreen } from 'hooks/useMediaScreens';

import { PageSidebarViewToggle } from './components/PageSidebarViewToggle';
import { SIDEBAR_VIEWS } from './constants';

const sidebarWidth = '430px';

const SidebarContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open: boolean }>(
  ({ open, theme }) => `
  background: ${theme.palette.background.default};
  border-left: 1px solid var(--input-border);
  overflow: hidden;
  max-width: ${open ? sidebarWidth : '50px'};
  width: 100%;
  transition: max-width ease-in 0.25s;
  height: 100%;
`
);

type SidebarProps = ProposalEvaluationsProps & {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
};

function SidebarComponent(props: SidebarProps) {
  const { isOpen, openSidebar, closeSidebar } = props;
  const isMdScreen = useMdScreen();

  function toggleSidebar() {
    (isOpen ? closeSidebar : openSidebar)();
  }
  if (!isMdScreen) {
    return null;
  }
  return (
    // <StyledCollapse
    //   appear={false}
    //   collapsedSize={40}
    //   orientation='horizontal'
    //   in={isOpen}
    //   // sx={{

    //   // }}
    //   easing={{
    //     enter: 'ease-in',
    //     exit: 'ease-out'
    //   }}
    //   timeout={250}
    // >
    <SidebarContainer id='proposal-action-sidebar' open={isOpen}>
      <Box overflow='hidden' width={sidebarWidth}>
        <Box display='flex' height='100%' flexDirection='column' gap={1} px={1}>
          <Box display='flex' gap={1} alignItems='center'>
            <PageSidebarViewToggle onClick={toggleSidebar} />
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {SIDEBAR_VIEWS.proposal_evaluation.title}
            </Typography>
          </Box>
          <ProposalEvaluations {...props} />
        </Box>
      </Box>
    </SidebarContainer>
    // </StyledCollapse>
  );
}

export const ProposalSidebar = memo(SidebarComponent);
