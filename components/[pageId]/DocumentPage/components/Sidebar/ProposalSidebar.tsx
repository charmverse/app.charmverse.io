import styled from '@emotion/styled';
import { Box, Drawer, Collapse, Typography } from '@mui/material';
import { memo } from 'react';

import type { ProposalEvaluationsProps } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { ProposalEvaluations } from 'components/proposals/ProposalPage/components/ProposalEvaluations/ProposalEvaluations';
import { useMdScreen } from 'hooks/useMediaScreens';

import { PageSidebarViewToggle } from './components/PageSidebarViewToggle';
import { SIDEBAR_VIEWS } from './constants';

const SidebarContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open: boolean }>(
  ({ open, theme }) => `
  background: ${theme.palette.background.default};
  border-left: 1px solid var(--input-border);
  overflow: auto;
  padding: ${theme.spacing(0, 1)};
  position: fixed;
  right: 0px;
  width: ${open ? '430px' : '36px'};
  z-index: var(--z-index-drawer);
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
    <Collapse
      appear={false}
      collapsedSize={40}
      orientation='horizontal'
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
      <SidebarContainer id='proposal-action-sidebar' open={isOpen}>
        <Box
          sx={{
            height: 'calc(100%)',
            gap: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box display='flex' gap={1} alignItems='center'>
            <PageSidebarViewToggle onClick={toggleSidebar} />
            <Typography flexGrow={1} fontWeight={600} fontSize={20}>
              {SIDEBAR_VIEWS.proposal_evaluation.title}
            </Typography>
          </Box>
          <ProposalEvaluations {...props} />
        </Box>
      </SidebarContainer>
    </Collapse>
  );
}

export const ProposalSidebar = memo(SidebarComponent);
